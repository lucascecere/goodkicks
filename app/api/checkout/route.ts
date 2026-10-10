import { NextRequest, NextResponse } from 'next/server';
import { createShopifyCart } from '@/lib/shopify/service';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { bundleTier } from '@/lib/townies/hat-sack';
import { storefrontOwn } from '@/lib/shop/catalog';
import { startStoreCheckout, StoreCheckoutError } from '@/lib/shop/store-checkout';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

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
  const discountCode: string | undefined = typeof body?.discountCode === 'string' ? body.discountCode : undefined;

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

  // Storefront switch: our own Stripe checkout instead of a Shopify cart.
  if (storefrontOwn()) {
    if (!rateLimit(`store-checkout:${callerIp(req.headers)}`, 15, 60_000)) {
      return NextResponse.json({ error: 'Too many tries. Give it a minute.' }, { status: 429 });
    }
    try {
      const { url } = await startStoreCheckout({ items, discountCode });
      return NextResponse.json({ url });
    } catch (err) {
      if (err instanceof StoreCheckoutError) return NextResponse.json({ error: err.message }, { status: 400 });
      console.error('[checkout] store checkout failed:', err);
      return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 });
    }
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
    const cart = await createShopifyCart(lines, discountCode ? [discountCode] : undefined);
    if (!cart) {
      return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
    }
    return NextResponse.json({ url: cart.checkoutUrl });
  } catch (err) {
    console.error('[checkout] Shopify error:', err);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}
