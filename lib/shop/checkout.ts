import 'server-only';
import type Stripe from 'stripe';
import { db, getProductsByIds, listSellers } from './db';
import { absoluteUrl, automaticTaxOn, getShopStripe, isTestShop, MARKET_BASE, siteUrl, testShopsVisible } from './config';
import { shippingCents, splitLine } from './money';
import { applyDiscount, discountProblem, normalizeCode } from './discounts';
import { findDiscount } from './discounts-db';
import type { Seller } from './types';

// Start a checkout: price the cart from the DATABASE (never from the
// browser), write a pending order with every line's split frozen, then open a
// Stripe Checkout Session on our own account. The webhook flips it to paid.

export type CartLine = { productId: string; qty: number };

export class CheckoutError extends Error {}

// Stripe Tax code for clothing. Massachusetts exempts clothing under $175.
const CLOTHING_TAX_CODE = 'txcd_30011000';

export async function startCheckout({
  lines,
  delivery,
  code,
}: {
  lines: CartLine[];
  delivery: 'ship' | 'pickup';
  code?: string | null;
}): Promise<{ url: string; orderId: string }> {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.qty);
  if (!merged.size) throw new CheckoutError('Your bag is empty.');

  const products = await getProductsByIds([...merged.keys()]);
  if (products.length !== merged.size) throw new CheckoutError('A hat in your bag is no longer available.');

  const sellers = new Map<string, Seller>(
    (await listSellers({ includeHouse: true })).map((s) => [s.id, s]),
  );

  const items = products.map((p) => {
    const seller = sellers.get(p.seller_id);
    // Townies' own hats still sell through Shopify; they can only go through
    // this checkout once SHOP_HOUSE_SELLING is deliberately turned on.
    const houseOff = seller?.kind === 'house' && process.env.SHOP_HOUSE_SELLING !== 'true';
    const open = seller?.status === 'live' || (Boolean(seller) && testShopsVisible() && isTestShop(seller!.slug) && seller!.status === 'approved');
    // A local business must have payouts connected before it can sell.
    const unpaid = seller?.kind === 'local' && !seller.payouts_enabled;
    if (!seller || houseOff || !open || unpaid || p.status !== 'active' || !p.price_cents) {
      throw new CheckoutError(`${p.title} isn't for sale right now.`);
    }
    const qty = merged.get(p.id)!;
    if (qty > 20) throw new CheckoutError('That is a lot of hats. Email us for a bulk order.');
    const split = splitLine({
      unitPriceCents: p.price_cents,
      wholesaleCents: p.wholesale_cents,
      qty,
      house: seller.kind === 'house',
      royalbacksSourced: seller.is_royalbacks_sourced,
    });
    return { product: p, seller, qty, split };
  });

  // Pickup happens at ONE business, so every hat must come from it.
  let pickupSeller: Seller | null = null;
  if (delivery === 'pickup') {
    const ids = new Set(items.map((i) => i.seller.id));
    pickupSeller = items[0].seller;
    if (ids.size > 1 || !pickupSeller.pickup_enabled) {
      throw new CheckoutError('Pickup works when every hat comes from the same business. Choose shipping instead.');
    }
  }

  const hatCount = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.product.price_cents! * i.qty, 0);

  // A code discounts Townies' own hats only (see discounts.ts).
  const priced = items.map((i) => ({ key: i.product.id, house: i.seller.kind === 'house', kind: i.product.kind, unitPriceCents: i.product.price_cents!, qty: i.qty }));
  let discount = { itemsCents: 0, perLine: {} as Record<string, number>, freeShipping: false };
  let discountCode: string | null = null;
  if (code && code.trim()) {
    const d = await findDiscount(code);
    if (!d) throw new CheckoutError("That code isn't valid.");
    const problem = discountProblem(d, priced);
    if (problem) throw new CheckoutError(problem);
    discount = applyDiscount(d, priced);
    discountCode = normalizeCode(d.code);
  }
  const afterDiscount = subtotal - discount.itemsCents;
  const shipping = discount.freeShipping ? 0 : shippingCents(hatCount, delivery, afterDiscount);

  const { data: order, error } = await db()
    .from('shop_orders')
    .insert({
      status: 'pending',
      delivery,
      pickup_seller_id: pickupSeller?.id ?? null,
      subtotal_cents: subtotal,
      shipping_cents: shipping,
      discount_code: discountCode,
      discount_cents: discount.itemsCents,
      total_cents: afterDiscount + shipping,
    })
    .select('id, number')
    .single();
  if (error || !order) throw new Error(`create order: ${error?.message}`);

  const { error: itemsErr } = await db()
    .from('shop_order_items')
    .insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        seller_id: i.seller.id,
        title: i.seller.kind === 'house' ? i.product.title : `${i.product.title} · ${i.seller.name}`,
        image_url: i.product.image_url,
        qty: i.qty,
        unit_price_cents: i.product.price_cents,
        wholesale_cents: i.product.wholesale_cents,
        seller_payout_cents: i.split.sellerPayoutCents,
        royalbacks_fee_cents: i.split.royalbacksFeeCents,
        // Discounts only land on our own hats, so they only ever come out of our cut.
        discount_cents: discount.perLine[i.product.id] ?? 0,
        our_cut_cents: i.split.ourCutCents - (discount.perLine[i.product.id] ?? 0),
      })),
    );
  if (itemsErr) throw new Error(`create order items: ${itemsErr.message}`);

  const base = siteUrl();
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    client_reference_id: order.id,
    metadata: { order_id: order.id, order_number: String(order.number), source: 'townies_shop' },
    payment_intent_data: {
      // Ties the later payouts to this charge.
      transfer_group: `order_${order.id}`,
      metadata: { order_id: order.id },
      description: `Townies order L${order.number}`,
    },
    line_items: items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: 'usd',
        unit_amount: i.product.price_cents!,
        tax_behavior: 'exclusive',
        product_data: {
          name: i.product.title,
          description: i.seller.kind === 'house' ? undefined : `From ${i.seller.name}${i.seller.town ? `, ${i.seller.town}` : ''}`,
          images: i.product.image_url ? [absoluteUrl(i.product.image_url)] : undefined,
          tax_code: CLOTHING_TAX_CODE,
        },
      },
    })),
    // Off unless a tax registration exists; see automaticTaxOn() in config.ts.
    branding_settings: { logo: { type: 'url', url: absoluteUrl('/brand/logos/script-word-white.png') } },
    automatic_tax: { enabled: automaticTaxOn() },
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
                  name: discountCode!,
                  redeem_by: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
                })
              ).id,
            },
          ],
        }
      : {}),
    phone_number_collection: { enabled: true },
    success_url: `${base}${MARKET_BASE}/order/${order.id}?thanks=1`,
    cancel_url: `${base}${MARKET_BASE}/bag`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  if (delivery === 'ship') {
    params.shipping_address_collection = { allowed_countries: ['US'] };
    params.shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shipping === 0 ? 'Free shipping (USPS Ground Advantage)' : 'USPS Ground Advantage',
          fixed_amount: { amount: shipping, currency: 'usd' },
          tax_behavior: 'exclusive',
          delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } },
        },
      },
    ];
  } else {
    // Stripe Tax needs an address; for pickup it's the business's own town.
    params.billing_address_collection = 'required';
    params.custom_text = {
      submit: { message: `Pick up at ${pickupSeller!.name}${pickupSeller!.pickup_address ? `, ${pickupSeller!.pickup_address}` : ''}. We'll email you when it's ready.` },
    };
  }

  const session = await getShopStripe().checkout.sessions.create(params);
  await db().from('shop_orders').update({ stripe_session_id: session.id }).eq('id', order.id);
  if (!session.url) throw new Error('Stripe returned no checkout URL.');
  return { url: session.url, orderId: order.id };
}
