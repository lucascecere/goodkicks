import 'server-only';
import type Stripe from 'stripe';
import { db, getSellerBySlug } from './db';
import { absoluteUrl, automaticTaxOn, getShopStripe, siteUrl } from './config';
import { houseProductsByIds, stockOf } from './catalog';
import { storeShippingCents } from './money';
import { applyDiscount, discountProblem, normalizeCode, type PricedLine } from './discounts';
import { findDiscount } from './discounts-db';
import { bundleTier } from '@/lib/townies/hat-sack';
import type { Product } from './types';

// Checkout for the Townies + Good Kicks store on our own engine (replaces
// createShopifyCart). Takes the cart exactly as the drawer sends it, prices
// every line from the database, and opens a Stripe Checkout Session.
//
// Line kinds the cart can hold:
// - a product (town hat, foot bag, 3-Pack): variantId = product UUID
// - a Hat & Sack: variantId = `hatsack:<tier>`, with _hat_variant and
//   _sack_variant attributes; the tier is re-derived from those two prices

export type StoreCartItem = {
  variantId: string;
  quantity: number;
  customAttributes?: { key: string; value: string }[];
};

export class StoreCheckoutError extends Error {}

const CLOTHING_TAX_CODE = 'txcd_30011000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Resolved = {
  key: string;
  productId: string | null;
  title: string;
  image: string | null;
  qty: number;
  unitCents: number;
  kind: Product['kind'];
  brand: Product['brand'];
  preorder: boolean;
  attributes: { key: string; value: string }[];
  /** Products whose stock this line uses up (a Hat & Sack uses the hat and the bag). */
  stockFrom: { id: string; qty: number }[];
};

const attr = (i: StoreCartItem, k: string) => i.customAttributes?.find((a) => a.key === k)?.value;

export async function startStoreCheckout({
  items,
  discountCode,
}: {
  items: StoreCartItem[];
  discountCode?: string | null;
}): Promise<{ url: string; orderId: string }> {
  if (!items.length) throw new StoreCheckoutError('Your cart is empty.');

  const ids = new Set<string>();
  for (const i of items) {
    if (i.variantId.startsWith('hatsack:')) {
      const h = attr(i, '_hat_variant');
      const s = attr(i, '_sack_variant');
      if (!h || !s || !UUID.test(h) || !UUID.test(s)) throw new StoreCheckoutError('Pick a hat and a foot bag for the bundle.');
      ids.add(h).add(s);
    } else if (UUID.test(i.variantId)) {
      ids.add(i.variantId);
    } else {
      throw new StoreCheckoutError('Something in your cart is out of date. Remove it and add it again.');
    }
  }
  const products = new Map((await houseProductsByIds([...ids])).map((p) => [p.id, p]));
  const [{ data: tiersRow }, { data: bundleRow }] = await Promise.all([
    db().from('shop_settings').select('value').eq('key', 'hat_sack_tiers').maybeSingle(),
    db().from('shop_products').select('id, image_url, status').eq('slug', 'hat-and-sack').maybeSingle(),
  ]);
  const tiers = tiersRow?.value ? (JSON.parse(tiersRow.value) as Record<string, number | null>) : {};

  const onSale = (p: Product | undefined): p is Product => Boolean(p && p.status === 'active' && p.price_cents);
  const lines: Resolved[] = items.map((i, n) => {
    if (i.quantity < 1 || i.quantity > 20) throw new StoreCheckoutError('Quantities run from 1 to 20.');
    if (i.variantId.startsWith('hatsack:')) {
      const hat = products.get(attr(i, '_hat_variant')!);
      const sack = products.get(attr(i, '_sack_variant')!);
      if (bundleRow?.status !== 'active') throw new StoreCheckoutError('The Hat & Sack is between restocks.');
      if (!onSale(hat) || !onSale(sack)) throw new StoreCheckoutError('That hat or foot bag just sold out. Pick another.');
      const tier = bundleTier(hat.price_cents, sack.price_cents);
      const cents = tiers[tier] ?? tiers.standard;
      if (!cents) throw new StoreCheckoutError('The Hat & Sack is between restocks.');
      return {
        key: `l${n}`,
        productId: bundleRow.id,
        title: `The Hat & Sack (${hat.title} + ${sack.title})`,
        image: bundleRow.image_url ?? hat.image_url,
        qty: i.quantity,
        unitCents: cents,
        kind: 'bundle',
        brand: 'townies',
        preorder: false,
        attributes: (i.customAttributes ?? []).filter((a) => !a.key.startsWith('_')),
        stockFrom: [
          { id: hat.id, qty: i.quantity },
          { id: sack.id, qty: i.quantity },
        ],
      };
    }
    const p = products.get(i.variantId);
    if (!onSale(p)) throw new StoreCheckoutError('Something in your cart is no longer for sale.');
    const left = stockOf(p);
    if (left !== null && left < i.quantity) {
      throw new StoreCheckoutError(left === 0 ? `${p.title} just sold out.` : `Only ${left} of ${p.title} left. Lower the quantity and try again.`);
    }
    return {
      key: `l${n}`,
      productId: p.id,
      title: p.title,
      image: p.image_url,
      qty: i.quantity,
      unitCents: p.price_cents!,
      kind: p.kind,
      brand: p.brand,
      preorder: p.preorder,
      attributes: (i.customAttributes ?? []).filter((a) => !a.key.startsWith('_')),
      stockFrom: [{ id: p.id, qty: i.quantity }],
    };
  });

  const merchandise = lines.reduce((n, l) => n + l.unitCents * l.qty, 0);
  const hats = (pre: boolean) => lines.filter((l) => l.kind === 'hat' && l.preorder === pre).reduce((n, l) => n + l.qty, 0);

  // Codes (rep, partner, pop-up, BOGOKICKS) from our own shop_discounts.
  const priced: PricedLine[] = lines.map((l) => ({ key: l.key, house: true, kind: l.kind, unitPriceCents: l.unitCents, qty: l.qty }));
  let discount = { itemsCents: 0, perLine: {} as Record<string, number>, freeShipping: false };
  let code: string | null = null;
  if (discountCode && discountCode.trim()) {
    const d = await findDiscount(discountCode);
    if (!d) throw new StoreCheckoutError("That code isn't valid.");
    const problem = discountProblem(d, priced);
    if (problem) throw new StoreCheckoutError(problem);
    discount = applyDiscount(d, priced);
    code = normalizeCode(d.code);
  }
  const shipping = discount.freeShipping
    ? 0
    : storeShippingCents({ standardHats: hats(false), preorderHats: hats(true), merchandiseCents: merchandise - discount.itemsCents });

  const brands = new Set(lines.map((l) => l.brand));
  const house = await getSellerBySlug('townies');
  if (!house) throw new Error('Townies seller row missing.');

  const { data: order, error } = await db()
    .from('shop_orders')
    .insert({
      status: 'pending',
      source: 'store',
      brand: brands.size > 1 ? 'mixed' : [...brands][0],
      delivery: 'ship',
      subtotal_cents: merchandise,
      shipping_cents: shipping,
      discount_code: code,
      discount_cents: discount.itemsCents,
      total_cents: merchandise - discount.itemsCents + shipping,
    })
    .select('id, number')
    .single();
  if (error || !order) throw new Error(`create order: ${error?.message}`);

  const { error: itemsErr } = await db()
    .from('shop_order_items')
    .insert(
      lines.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        seller_id: house.id,
        title: l.title,
        image_url: l.image,
        qty: l.qty,
        unit_price_cents: l.unitCents,
        wholesale_cents: 0,
        seller_payout_cents: 0,
        royalbacks_fee_cents: 0,
        discount_cents: discount.perLine[l.key] ?? 0,
        our_cut_cents: l.unitCents * l.qty - (discount.perLine[l.key] ?? 0),
        attributes: [
          ...l.attributes,
          ...(l.preorder ? [{ key: 'Fulfillment', value: 'Pre-order' }] : []),
          { key: '_stock', value: JSON.stringify(l.stockFrom) },
        ],
      })),
    );
  if (itemsErr) throw new Error(`create order items: ${itemsErr.message}`);

  const base = siteUrl();
  const anyPreorder = lines.some((l) => l.preorder);
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    client_reference_id: order.id,
    metadata: { order_id: order.id, order_number: String(order.number), source: 'townies_store' },
    payment_intent_data: { metadata: { order_id: order.id }, description: `Townies order #${order.number}` },
    line_items: lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency: 'usd',
        unit_amount: l.unitCents,
        tax_behavior: 'exclusive',
        product_data: {
          name: l.title,
          description: [l.preorder ? 'Pre-order: ships in 3 to 4 weeks' : null, ...l.attributes.map((a) => `${a.key}: ${a.value}`)].filter(Boolean).join(' · ') || undefined,
          images: l.image ? [absoluteUrl(l.image)] : undefined,
          tax_code: CLOTHING_TAX_CODE,
        },
      },
    })),
    // The account logo is navy, which disappears on the navy header; show the
    // white script wordmark instead.
    branding_settings: { logo: { type: 'url', url: absoluteUrl('/brand/logos/script-word-white.png') } },
    automatic_tax: { enabled: automaticTaxOn() },
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ['US'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shipping === 0 ? 'Free shipping' : anyPreorder ? 'Standard shipping (pre-orders ship in 3 to 4 weeks)' : 'Standard shipping',
          fixed_amount: { amount: shipping, currency: 'usd' },
          tax_behavior: 'exclusive',
          delivery_estimate: anyPreorder
            ? { minimum: { unit: 'week', value: 3 }, maximum: { unit: 'week', value: 5 } }
            : { minimum: { unit: 'business_day', value: 2 }, maximum: { unit: 'business_day', value: 7 } },
        },
      },
    ],
    ...(discount.itemsCents > 0
      ? {
          discounts: [
            {
              coupon: (
                await getShopStripe().coupons.create({
                  amount_off: discount.itemsCents,
                  currency: 'usd',
                  duration: 'once',
                  max_redemptions: 1,
                  name: code!,
                  redeem_by: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
                })
              ).id,
            },
          ],
        }
      : {}),
    success_url: `${base}/checkout/success?order=${order.id}`,
    cancel_url: `${base}/shop`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const session = await getShopStripe().checkout.sessions.create(params);
  await db().from('shop_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  if (!session.url) throw new Error('Stripe returned no checkout URL.');
  return { url: session.url, orderId: order.id };
}
