import 'server-only';
import { db, getOrder, getOrderItems, listPayouts, updatePayout } from './db';
import { getShopStripe } from './config';
import { royalbacksAccountId } from './royalbacks';
import { releaseAt } from './money';
import type { Order, OrderItem, Payout, Seller } from './types';

// The payout queue.
//
//   paid       → one HELD row per business in the order (+ one for Dylan when
//                any of those businesses came through RoyalBacks)
//   handed over (shipped / picked up) → release_at = +14 days
//   cron       → rows past release_at become transfers to the Express account
//   refund     → held rows are canceled; already-transferred rows are reversed

/** Write the held payout rows for a freshly paid order. Safe to call twice. */
export async function createHeldPayouts(order: Order, items: OrderItem[], sellers: Map<string, Seller>) {
  const bySeller = new Map<string, number>();
  let royalbacks = 0;
  for (const i of items) {
    const s = sellers.get(i.seller_id);
    if (!s || s.kind === 'house') continue;
    bySeller.set(s.id, (bySeller.get(s.id) ?? 0) + i.seller_payout_cents);
    royalbacks += i.royalbacks_fee_cents;
  }
  const rows: Pick<Payout, 'order_id' | 'recipient' | 'seller_id' | 'amount_cents' | 'stripe_account_id'>[] = [
    ...bySeller.entries(),
  ]
    .filter(([, cents]) => cents > 0)
    .map(([sellerId, cents]) => ({
      order_id: order.id,
      recipient: 'seller',
      seller_id: sellerId,
      amount_cents: cents,
      stripe_account_id: sellers.get(sellerId)?.stripe_account_id ?? null,
    }));
  if (royalbacks > 0) {
    rows.push({ order_id: order.id, recipient: 'royalbacks', seller_id: null, amount_cents: royalbacks, stripe_account_id: await royalbacksAccountId() });
  }

  // A webhook retry must not double the queue: insert only what isn't there.
  // The unique index (order, recipient, seller) backs this up under a race.
  const have = new Set((await listPayouts({ orderId: order.id })).map((p) => `${p.recipient}:${p.seller_id ?? ''}`));
  const missing = rows.filter((r) => !have.has(`${r.recipient}:${r.seller_id ?? ''}`));
  if (!missing.length) return;
  const { error } = await db().from('shop_payouts').insert(missing);
  if (error && !/duplicate key/i.test(error.message)) throw new Error(`payouts: ${error.message}`);
}

/** The hat left our hands: start the 14-day clock on this order's payouts. */
export async function startPayoutClock(orderId: string, at = new Date()) {
  await db()
    .from('shop_payouts')
    .update({ release_at: releaseAt(at).toISOString(), updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .eq('status', 'held');
}

/** Send one payout now. Returns an error string instead of throwing. */
export async function transferPayout(p: Payout, order?: Order | null): Promise<string | null> {
  const o = order ?? (await getOrder(p.order_id));
  if (!o) return 'order not found';
  if (o.status !== 'paid' && o.status !== 'partially_refunded') return `order is ${o.status}`;

  let destination = p.stripe_account_id;
  // Dylan may connect after the sale, so always read his current account.
  if (p.recipient === 'royalbacks') destination = await royalbacksAccountId();
  if (p.recipient === 'seller' && p.seller_id) {
    const { data: s } = await db().from('shop_sellers').select('stripe_account_id, payouts_enabled').eq('id', p.seller_id).single();
    destination = s?.stripe_account_id ?? null;
    if (!s?.payouts_enabled) {
      await updatePayout(p.id, { status: 'due', error: 'Business has not finished connecting payouts.' });
      return 'payouts not enabled';
    }
  }
  if (!destination) {
    await updatePayout(p.id, { status: 'due', error: 'No Stripe account to pay.' });
    return 'no destination';
  }

  try {
    const transfer = await getShopStripe().transfers.create(
      {
        amount: p.amount_cents,
        currency: 'usd',
        destination,
        transfer_group: `order_${o.id}`,
        // Funds the transfer from this order's charge, so it can go out
        // before the charge's money has settled into our balance.
        ...(o.stripe_charge_id ? { source_transaction: o.stripe_charge_id } : {}),
        description: `Townies order L${o.number}`,
        metadata: { order_id: o.id, payout_id: p.id, recipient: p.recipient },
      },
      { idempotencyKey: `payout_${p.id}` },
    );
    await updatePayout(p.id, { status: 'transferred', stripe_transfer_id: transfer.id, stripe_account_id: destination, error: null });
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'transfer failed';
    await updatePayout(p.id, { status: 'due', error: msg });
    return msg;
  }
}

/** Cron: send every payout whose hold has ended. */
export async function releaseDuePayouts(now = new Date()) {
  const { data, error } = await db()
    .from('shop_payouts')
    .select('*')
    .in('status', ['held', 'due'])
    .not('release_at', 'is', null)
    .lte('release_at', now.toISOString())
    .limit(200);
  if (error) throw new Error(error.message);
  const results: { id: string; error: string | null }[] = [];
  for (const p of (data ?? []) as Payout[]) {
    results.push({ id: p.id, error: await transferPayout(p) });
  }
  return results;
}

/**
 * The order was refunded or disputed. Cancel what hasn't gone out; reverse
 * what has. `fraction` < 1 for a partial refund scales the clawback.
 */
export async function unwindPayouts(orderId: string, fraction = 1) {
  const payouts = await listPayouts({ orderId });
  const stripe = getShopStripe();
  for (const p of payouts) {
    if (p.status === 'held' || p.status === 'due') {
      if (fraction >= 1) await updatePayout(p.id, { status: 'canceled' });
      else await updatePayout(p.id, { amount_cents: Math.round(p.amount_cents * (1 - fraction)) });
    } else if (p.status === 'transferred' && p.stripe_transfer_id) {
      try {
        const amount = Math.round(p.amount_cents * Math.min(1, fraction));
        await stripe.transfers.createReversal(p.stripe_transfer_id, { amount }, { idempotencyKey: `reverse_${p.id}_${amount}` });
        if (fraction >= 1) await updatePayout(p.id, { status: 'reversed' });
      } catch (err) {
        await updatePayout(p.id, { error: `reversal failed: ${err instanceof Error ? err.message : err}` });
      }
    }
  }
}

export async function orderPayoutSummary(orderId: string) {
  const [payouts, items] = await Promise.all([listPayouts({ orderId }), getOrderItems(orderId)]);
  const ourCut = items.reduce((n, i) => n + i.our_cut_cents, 0);
  return { payouts, ourCut };
}
