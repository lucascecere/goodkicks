import 'server-only';
import type Stripe from 'stripe';
import { adjustStock, db, getOrder, getOrderItems, getProductsByIds, getSellerByStripeAccount, listSellers, updateOrder, updateSeller } from './db';
import { getShopStripe } from './config';
import { createHeldPayouts, unwindPayouts } from './payouts';
import { sendAdminNewOrder, sendOrderReceipt, sendSellerSale } from './email';
import type { Order, Seller, ShippingAddress } from './types';

// Stripe events for the shop's own account. Every handler is idempotent:
// Stripe retries, and a paid order must only be processed once.

async function quietly(what: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[shop] ${what} failed:`, err);
  }
}

function addressFrom(a: Stripe.Address | null | undefined, name?: string | null): ShippingAddress | null {
  if (!a) return null;
  return { name: name ?? null, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postal_code: a.postal_code, country: a.country };
}

export async function markOrderPaid(sessionId: string) {
  const stripe = getShopStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  if (session.payment_status !== 'paid') return;

  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const order = await getOrder(orderId);
  // Only a pending order moves to paid. A retry, or a session for an order we
  // already canceled, stops here.
  if (!order || order.status !== 'pending') return;

  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const chargeId = typeof pi?.latest_charge === 'string' ? pi.latest_charge : (pi?.latest_charge?.id ?? null);
  const shipping =
    (session as unknown as { collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } } })
      .collected_information?.shipping_details ??
    (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } }).shipping_details ??
    null;

  // Conditional on still being pending, so two deliveries racing each other
  // can't both get past this line.
  const { data: claimed, error } = await db()
    .from('shop_orders')
    .update({
      updated_at: new Date().toISOString(),
    status: 'paid',
    paid_at: new Date().toISOString(),
    buyer_name: session.customer_details?.name ?? shipping?.name ?? null,
    buyer_email: session.customer_details?.email ?? null,
    buyer_phone: session.customer_details?.phone ?? null,
    shipping_address: order.delivery === 'ship' ? addressFrom(shipping?.address, shipping?.name) : null,
    tax_cents: session.total_details?.amount_tax ?? 0,
    shipping_cents: session.shipping_cost?.amount_total ?? order.shipping_cents,
    total_cents: session.amount_total ?? order.total_cents,
    stripe_payment_intent_id: pi?.id ?? null,
    stripe_charge_id: chargeId,
    })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(`mark paid: ${error.message}`);
  if (!claimed) return;
  const paid = claimed as Order;

  const items = await getOrderItems(order.id);
  const sellers = new Map<string, Seller>((await listSellers({ includeHouse: true })).map((s) => [s.id, s]));

  // Take the hats off the shelf. Anything that goes below zero is made to
  // order: the sale stands and the admin is told to order from RoyalBacks.
  const short: string[] = [];
  for (const i of items) {
    if (!i.product_id) continue;
    const left = await adjustStock(i.product_id, -i.qty);
    if (left !== null && left < 0) short.push(i.title);
  }
  const final: Order = short.length ? await updateOrder(order.id, { fulfillment: 'needs_production' }) : paid;

  await createHeldPayouts(final, items, sellers);

  const pickupAt = final.pickup_seller_id ? (sellers.get(final.pickup_seller_id) ?? null) : null;
  await quietly('receipt email', () => sendOrderReceipt(final, items, pickupAt));
  await quietly('admin email', () => sendAdminNewOrder(final, items, sellers, short));
  for (const sellerId of new Set(items.map((i) => i.seller_id))) {
    const s = sellers.get(sellerId);
    if (s && s.kind === 'local') await quietly('seller email', () => sendSellerSale(s, final, items));
  }
}

async function orderForCharge(charge: Stripe.Charge): Promise<Order | null> {
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return null;
  const pi = await getShopStripe().paymentIntents.retrieve(piId);
  const orderId = pi.metadata?.order_id;
  return orderId ? getOrder(orderId) : null;
}

/** A refund made anywhere (our admin, or the Stripe dashboard). */
export async function handleRefund(charge: Stripe.Charge) {
  const order = await orderForCharge(charge);
  if (!order) return;
  const full = charge.amount_refunded >= charge.amount;
  await updateOrder(order.id, {
    status: full ? 'refunded' : 'partially_refunded',
    ...(full && !['shipped', 'delivered', 'picked_up'].includes(order.fulfillment) ? { fulfillment: 'canceled' as const } : {}),
  });
  // Only the hat price is shared with businesses; scale by the share of the
  // charge refunded.
  await unwindPayouts(order.id, full ? 1 : charge.amount_refunded / charge.amount);
  if (full && !['shipped', 'delivered', 'picked_up'].includes(order.fulfillment)) {
    // Never left the shelf: put the hats back.
    const items = await getOrderItems(order.id);
    const products = await getProductsByIds(items.map((i) => i.product_id).filter((x): x is string => Boolean(x)));
    for (const i of items) if (i.product_id && products.some((p) => p.id === i.product_id)) await adjustStock(i.product_id, i.qty);
  }
}

export async function handleDispute(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
  const charge = await getShopStripe().charges.retrieve(chargeId);
  const order = await orderForCharge(charge);
  if (!order) return;
  await updateOrder(order.id, { status: 'disputed' });
  await unwindPayouts(order.id, 1);
}

export async function handleSessionExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const order = await getOrder(orderId);
  if (order?.status === 'pending') await updateOrder(order.id, { status: 'canceled', fulfillment: 'canceled' });
}

/** A business finished (or lost) their payout setup. */
export async function handleAccountUpdated(account: Stripe.Account) {
  const seller = await getSellerByStripeAccount(account.id);
  if (!seller) return;
  const enabled = account.capabilities?.transfers === 'active' && Boolean(account.details_submitted);
  if (enabled !== seller.payouts_enabled) await updateSeller(seller.id, { payouts_enabled: enabled });
}

export async function handleShopEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return markOrderPaid((event.data.object as Stripe.Checkout.Session).id);
    case 'checkout.session.expired':
      return handleSessionExpired(event.data.object as Stripe.Checkout.Session);
    case 'charge.refunded':
      return handleRefund(event.data.object as Stripe.Charge);
    case 'charge.dispute.created':
      return handleDispute(event.data.object as Stripe.Dispute);
    case 'account.updated':
      return handleAccountUpdated(event.data.object as Stripe.Account);
    default:
      return;
  }
}
