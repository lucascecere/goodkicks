import { NextRequest, NextResponse } from 'next/server';
import { createShopifyCart } from '@/lib/shopify/service';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { bundleTier } from '@/lib/townies/hat-sack';

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
  const body = await req.json();
  const items: CheckoutItem[] = body?.items ?? [];
  const discountCode: string | undefined = body?.discountCode;

  if (!items.length) {
    return NextResponse.json({ error: 'cart is empty' }, { status: 400 });
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
