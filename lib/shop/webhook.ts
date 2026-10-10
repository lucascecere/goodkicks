import 'server-only';
import type Stripe from 'stripe';
import { adjustStock, db, getOrder, getOrderItems, getProductsByIds, getSellerByStripeAccount, listSellers, updateOrder, updateSeller } from './db';
import { getShopStripe } from './config';
import { createHeldPayouts, unwindPayouts } from './payouts';
import { sendAdminNewOrder, sendOrderReceipt, sendSellerSale } from './email';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { markDiscountUsed } from './discounts-db';
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
  if (!order) return;
  // A canceled or refunded order never comes back to life.
  if (order.status !== 'pending' && order.status !== 'paid') return;

  let paid: Order = order;
  if (order.status === 'pending') {
    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const chargeId = typeof pi?.latest_charge === 'string' ? pi.latest_charge : (pi?.latest_charge?.id ?? null);
    const shipping =
      (session as unknown as { collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } } })
        .collected_information?.shipping_details ??
      (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } }).shipping_details ??
      null;

    // Conditional on still being pending, so two deliveries racing each other
    // can't both flip it.
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
    paid = (claimed as Order | null) ?? ((await getOrder(order.id)) as Order);
    if (paid.status !== 'paid') return;
  }

  // Everything below runs on every delivery of this event, and each step is
  // safe to repeat: stock and notifications are claimed once with a
  // timestamp, payouts only insert what's missing. So if Stripe retries after
  // a step failed, only the unfinished steps run (2026-10-09 review).
  await finishPaidOrder(paid);
}

/** Claim a one-time step on an order; true only for the first caller. */
async function claimStep(orderId: string, column: 'stock_taken_at' | 'notified_at'): Promise<boolean> {
  const { data, error } = await db()
    .from('shop_orders')
    .update({ [column]: new Date().toISOString() })
    .eq('id', orderId)
    .is(column, null)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`claim ${column}: ${error.message}`);
  return Boolean(data);
}

async function finishPaidOrder(paid: Order) {
  const items = await getOrderItems(paid.id);
  const sellers = new Map<string, Seller>((await listSellers({ includeHouse: true })).map((s) => [s.id, s]));

  // Take the hats off the shelf, once. Anything that goes below zero is made
  // to order: the sale stands and the admin is told to order from RoyalBacks.
  const short: string[] = [];
  let final: Order = paid;
  if (await claimStep(paid.id, 'stock_taken_at')) {
    for (const i of items) {
      if (!i.product_id) continue;
      const left = await adjustStock(i.product_id, -i.qty);
      if (left !== null && left < 0) short.push(i.title);
    }
    if (short.length) final = await updateOrder(paid.id, { fulfillment: 'needs_production' });
    if (final.discount_code) await quietly('discount count', () => markDiscountUsed(final.discount_code!));
  }

  await createHeldPayouts(final, items, sellers);

  if (!(await claimStep(paid.id, 'notified_at'))) return;

  // Market buyers join the same Customers list as Shopify buyers, so
  // campaigns and the review emails can reach them.
  if (final.buyer_email) {
    await quietly('contact upsert', () => upsertContact({ email: final.buyer_email!, name: final.buyer_name, source: 'order', brand: 'townies' }));
  }

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
export async function handleRefund(eventCharge: Stripe.Charge) {
  // Re-read the charge with our pinned client instead of trusting the event
  // payload: the live endpoint sends a newer API version (endive) than the
  // client (dahlia), and this keeps the fields we use in one known shape.
  const charge = await getShopStripe().charges.retrieve(eventCharge.id);
  const order = await orderForCharge(charge);
  if (!order) return;
  const full = charge.amount_refunded >= charge.amount;
  await updateOrder(order.id, {
    status: full ? 'refunded' : 'partially_refunded',
    ...(full && !['shipped', 'delivered', 'picked_up'].includes(order.fulfillment) ? { fulfillment: 'canceled' as const } : {}),
  });
  // Businesses only share in the hats. A refund is treated as coming out of
  // shipping and tax first, then the hats, and `amount_refunded` is a running
  // total, so we compute the cumulative share of hat value refunded and unwind
  // only the part not already unwound (2026-10-09 review).
  const hats = Math.max(1, order.subtotal_cents - (order.discount_cents ?? 0));
  const target = full ? 1 : Math.min(1, Math.max(0, (charge.amount_refunded - order.shipping_cents - order.tax_cents) / hats));
  const already = Number(order.payout_unwound_fraction ?? 0);
  if (target > already) {
    await unwindPayouts(order.id, already, target);
    await updateOrder(order.id, { payout_unwound_fraction: target });
  }
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
  const already = Number(order.payout_unwound_fraction ?? 0);
  if (already < 1) {
    await unwindPayouts(order.id, already, 1);
    await updateOrder(order.id, { payout_unwound_fraction: 1 });
  }
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
    case 'checkout.session.async_payment_failed':
      // Either way no money arrived: the pending order is canceled.
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
