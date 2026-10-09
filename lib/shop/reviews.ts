import 'server-only';
import { newToken } from '@/lib/reviews/server';
import { db, getOrderItems } from './db';
import type { Order } from './types';

// Market orders get the same single "How's the hat?" email as Shopify orders,
// through the same review_requests queue and daily cron. The queue is keyed
// by shopify_order_id; ours use "market:<order id>" so the two never collide.

const AFTER_HANDOVER_DAYS = 7;
const NO_SCAN_DAYS = 14;

export async function queueMarketReview(order: Order, basis: 'delivered' | 'picked_up' | 'no-scan', at = new Date()) {
  if (!order.buyer_email) return;
  const items = await getOrderItems(order.id);
  const first = items[0];
  const wait = basis === 'no-scan' ? NO_SCAN_DAYS : AFTER_HANDOVER_DAYS;
  const { error } = await db()
    .from('review_requests')
    .insert({
      shopify_order_id: `market:${order.id}`,
      order_number: `L${order.number}`,
      email: order.buyer_email,
      name: order.buyer_name,
      brand: 'townies',
      product_title: first?.title ?? null,
      fulfilled_at: at.toISOString(),
      send_after: new Date(at.getTime() + wait * 864e5).toISOString(),
      token: newToken(),
    });
  // One ask per order: hitting the unique index means it's already queued.
  if (error && error.code !== '23505') console.error('[shop] review queue', error.message);
}
