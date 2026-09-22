// Shopify fulfilment webhook → a review request, due in a week's time.
//
// The ask goes out AFTER the hat has actually arrived and been worn for a few
// days — not at checkout, and not to everyone who ever ordered. Nobody is mass
// mailed: this only ever queues the order that just shipped.
//
// SETUP: none. The subscription is created and repaired automatically by
// `reconcileWebhooks()` on the daily cron — see lib/shopify/webhooks.ts for why
// that exists rather than a line in a setup doc.
//
// Like the orders route, this acknowledges FIRST and works afterwards, because
// Shopify deletes a subscription that fails or takes over five seconds.
//
// Queuing is not sending. `app/api/cron/review-requests` does the sending, and
// it will not send at all until REVIEW_REQUESTS_ENABLED is set — so this can be
// wired up and left to accumulate safely while the copy is still being agreed.

import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { newToken } from '@/lib/reviews/server';
import { lineBrand, type ShopifyLineItem } from '@/lib/shopify/orders-source';
import { verifyWebhook } from '@/lib/shopify/webhooks';

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

export async function POST(req: NextRequest) {
  if (!process.env.SHOPIFY_WEBHOOK_SECRET && !process.env.SHOPIFY_CLIENT_SECRET) {
    console.error('[fulfillment-webhook] no signing secret configured — rejecting.');
    return new Response('Webhook not configured', { status: 503 });
  }

  // HMAC is over the RAW bytes — re-serialising the parsed JSON changes key
  // order and the signature stops matching.
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get('x-shopify-hmac-sha256'))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: WebhookFulfillment;
  try {
    body = JSON.parse(raw) as WebhookFulfillment;
  } catch {
    return Response.json({ ok: true, skipped: 'unparseable payload' });
  }

  // Queued after the 200. A missed queue entry costs one review request; a slow
  // response costs the whole subscription.
  after(async () => {
    const email = body.email || body.order?.email;
    const orderId = body.order_id;
    if (!email || !orderId) return;

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
      if (error && error.code !== '23505') {
        console.error('[fulfillment-webhook] queue insert failed:', error.message);
      }
    } catch (err) {
      console.error('[fulfillment-webhook] threw:', err);
    }
  });

  return Response.json({ ok: true });
}
