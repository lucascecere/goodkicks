// Shopify fulfilment webhook → a review request, due in a week's time.
//
// The ask goes out AFTER the hat has actually arrived and been worn for a few
// days — not at checkout, and not to everyone who ever ordered. Nobody is mass
// mailed: this only ever queues the order that just shipped.
//
// SETUP (one-time, in Shopify admin):
//   Settings → Notifications → Webhooks → Create webhook
//     Event:  Fulfillment creation      Format: JSON
//     URL:    https://townies.shop/api/webhooks/shopify/fulfillments
//   It signs with the SAME secret as the orders webhook, so SHOPIFY_WEBHOOK_SECRET
//   covers both. Without it this route rejects everything, which is the correct
//   failure mode for an unauthenticated public endpoint.
//
// Queuing is not sending. `app/api/cron/review-requests` does the sending, and
// it will not send at all until REVIEW_REQUESTS_ENABLED is set — so this can be
// wired up and left to accumulate safely while the copy is still being agreed.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { newToken } from '@/lib/reviews/server';
import { lineBrand, type ShopifyLineItem } from '@/lib/shopify/orders-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** How long after the parcel ships before we ask. */
const WAIT_DAYS = 7;

type WebhookFulfillment = {
  id?: number;
  order_id?: number;
  created_at?: string | null;
  email?: string | null;
  name?: string | null;
  destination?: { first_name?: string | null; last_name?: string | null } | null;
  line_items?: ShopifyLineItem[];
  order?: { email?: string | null; order_number?: number | null } | null;
};

function verify(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(header, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[fulfillment-webhook] SHOPIFY_WEBHOOK_SECRET is not set — rejecting.');
    return new Response('Webhook not configured', { status: 503 });
  }

  // HMAC is over the RAW bytes — re-serialising the parsed JSON changes key
  // order and the signature stops matching.
  const raw = await req.text();
  if (!verify(raw, req.headers.get('x-shopify-hmac-sha256'), secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: WebhookFulfillment;
  try {
    body = JSON.parse(raw) as WebhookFulfillment;
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  const email = body.email || body.order?.email;
  const orderId = body.order_id;
  if (!email || !orderId) {
    // A fulfilment with no email is not a failure — acknowledge so Shopify
    // stops retrying.
    return Response.json({ ok: true, skipped: 'no email or order id' });
  }

  const first = (body.line_items ?? [])[0];
  const brand = first ? lineBrand(first, body.created_at) : 'townies';
  const name =
    [body.destination?.first_name, body.destination?.last_name].filter(Boolean).join(' ') ||
    undefined;

  const fulfilledAt = body.created_at ? new Date(body.created_at) : new Date();
  const sendAfter = new Date(fulfilledAt.getTime() + WAIT_DAYS * 864e5);

  try {
    const { error } = await createSupabaseServiceClient().from('review_requests').insert({
      shopify_order_id: String(orderId),
      order_number: body.order?.order_number ? String(body.order.order_number) : null,
      email,
      name,
      brand,
      product_title: first?.title ?? null,
      fulfilled_at: fulfilledAt.toISOString(),
      send_after: sendAfter.toISOString(),
      token: newToken(),
    });

    // A split or re-issued fulfilment fires this again for an order already
    // queued. The unique constraint is what makes "one ask per order" true;
    // hitting it is the system working, not an error.
    if (error && error.code === '23505') {
      return Response.json({ ok: true, skipped: 'already queued' });
    }
    if (error) {
      console.error('[fulfillment-webhook] insert failed:', error.message);
      // 500 so Shopify retries — losing the queue entry loses the review.
      return new Response('Could not queue', { status: 500 });
    }
  } catch (err) {
    console.error('[fulfillment-webhook] threw:', err);
    return new Response('Could not queue', { status: 500 });
  }

  return Response.json({ ok: true, queued: true, sendAfter: sendAfter.toISOString() });
}
