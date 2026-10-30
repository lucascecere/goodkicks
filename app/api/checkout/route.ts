import { NextRequest, NextResponse } from 'next/server';
import { createShopifyCart } from '@/lib/shopify/service';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { bundleTier } from '@/lib/townies/hat-sack';
import { sendEmail } from '@/lib/email/resend-client';

/**
 * A failed checkout used to be a console line nobody read. Email the shop, at
 * most once per 15 minutes per server instance so an outage is one alert, not
 * a flood.
 */
let lastAlertAt = 0;
async function alertCheckoutFailure(detail: string, items: CheckoutItem[]) {
  if (Date.now() - lastAlertAt < 15 * 60 * 1000) return;
  lastAlertAt = Date.now();
  try {
    await sendEmail({
      from: `Townies site <${process.env.TOWNIES_FROM_EMAIL ?? 'info@goodkicks.co'}>`,
      to: process.env.SHOP_NOTIFY_EMAIL || 'info@townies.shop',
      subject: 'Checkout failed on townies.shop',
      text: `A shopper hit "checkout failed".\n\n${detail}\n\nBag: ${items.map((i) => `${i.quantity} x ${i.variantId}`).join(', ')}\n\nVercel logs: search "[checkout]" / "[createShopifyCart]".`,
    });
  } catch (err) {
    console.error('[checkout] alert email failed:', err);
  }
}

/**
 * Hat & Sack guard (2026-10-08): the bundle has three price tiers ($35/$40/$45,
 * decided by the picked hat and bag). The browser picks the tier variant, so
 * re-derive it here from the picked items' real prices and put the line on the
 * right variant. A bundle line with no picks at all is refused.
 */
async function fixBundleLines(items: CheckoutItem[]): Promise<CheckoutItem[] | null> {
  const offer = await getHatSackOffer();
  const bundleIds = new Set(
    [offer.tiers.everyday.id, offer.tiers.standard.id, offer.tiers.titletown.id, offer.preorderId].filter(Boolean),
  );
  if (!items.some((i) => bundleIds.has(i.variantId))) return items;

  const attr = (i: CheckoutItem, k: string) => i.customAttributes?.find((a) => a.key === k)?.value;
  const pickIds = items.flatMap((i) => (bundleIds.has(i.variantId) ? [attr(i, '_hat_variant'), attr(i, '_sack_variant')] : []));
  if (pickIds.some((id) => !id)) return null;

  const data = await shopifyAdminGraphQL<{ nodes: Array<{ id: string; price: string } | null> }>(
    'query($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { id price } } }',
    { ids: [...new Set(pickIds as string[])] },
  );
  const cents = new Map(data.nodes.filter(Boolean).map((n) => [n!.id, Math.round(parseFloat(n!.price) * 100)]));

  return items.map((i) => {
    if (!bundleIds.has(i.variantId)) return i;
    const tier = offer.tiers[bundleTier(cents.get(attr(i, '_hat_variant')!) ?? null, cents.get(attr(i, '_sack_variant')!) ?? null)];
    return tier.id ? { ...i, variantId: tier.id } : i;
  });
}

type CheckoutItem = {
  variantId: string;
  quantity: number;
  customAttributes?: Array<{ key: string; value: string }>;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items: CheckoutItem[] = Array.isArray(body?.items) ? body.items : [];
  // Up to two codes: the first-order pop-up hands out a $5-off + free-shipping
  // pair that the bag applies together. Junk is dropped, not passed to Shopify.
  const discountCodes: string[] = [
    ...(typeof body?.discountCode === 'string' ? [body.discountCode] : []),
    ...(Array.isArray(body?.discountCodes) ? body.discountCodes : []),
  ]
    .filter((c): c is string => typeof c === 'string' && /^[A-Z0-9-]{3,40}$/i.test(c))
    .slice(0, 2);
  // First-touch attribution from the bag (lib/attribution.ts). Shopify shows
  // these on the order; anything malformed is dropped, never a reason to fail.
  const attributes: Array<{ key: string; value: string }> = (Array.isArray(body?.attributes) ? body.attributes : [])
    .filter((a: unknown): a is { key: string; value: string } =>
      !!a && typeof (a as { key?: unknown }).key === 'string' && typeof (a as { value?: unknown }).value === 'string')
    .slice(0, 8)
    .map((a: { key: string; value: string }) => ({ key: a.key.slice(0, 40), value: a.value.slice(0, 200) }));

  if (!items.length) {
    return NextResponse.json({ error: 'cart is empty' }, { status: 400 });
  }
  // A malformed line (no variant id, zero or fractional quantity) is the
  // caller's mistake, not ours: say so with a 400 rather than letting Shopify
  // throw and surfacing it as a 500.
  const bad = items.findIndex(
    (i) =>
      !i ||
      typeof i.variantId !== 'string' ||
      !i.variantId.trim() ||
      !Number.isInteger(i.quantity) ||
      i.quantity <= 0 ||
      (i.customAttributes !== undefined && !Array.isArray(i.customAttributes)),
  );
  if (bad !== -1) {
    return NextResponse.json(
      { error: `Item ${bad + 1} needs a variantId string and a whole-number quantity above 0.` },
      { status: 400 },
    );
  }

  let checked: CheckoutItem[] | null;
  try {
    checked = await fixBundleLines(items);
  } catch (err) {
    console.error('[checkout] bundle check failed:', err);
    checked = items;
  }
  if (!checked) {
    return NextResponse.json({ error: 'Pick a hat and a foot bag for the bundle.' }, { status: 400 });
  }

  const lines = checked.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
    ...(item.customAttributes?.length ? { attributes: item.customAttributes } : {}),
  }));

  try {
    const cart = await createShopifyCart(lines, discountCodes.length ? discountCodes : undefined, attributes);
    if (!cart) {
      await alertCheckoutFailure('Shopify did not return a cart (see [createShopifyCart] in the logs).', checked);
      return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
    }
    return NextResponse.json({ url: cart.checkoutUrl });
  } catch (err) {
    console.error('[checkout] Shopify error:', err);
    await alertCheckoutFailure(String(err), checked);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}
