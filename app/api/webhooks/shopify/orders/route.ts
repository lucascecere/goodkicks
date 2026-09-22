// Shopify order webhook → contacts.
//
// This is what makes "every order lands in the admin contacts list" true
// automatically. Point Shopify's `orders/create` (and ideally `orders/paid`)
// webhook at this URL and every buyer is captured within seconds, tagged with
// the brand they actually bought.
//
// The manual Sync button still exists for backfill and repair; both write
// through the same upsertContact, so running one after the other changes
// nothing.
//
// ─────────────────────────────────────────────────────────────────────────
//  THIS ROUTE MUST ANSWER FAST AND MUST NOT FAIL.
//
//  Shopify removes a webhook subscription "after multiple failures in a
//  24-hour period", and a response slower than FIVE SECONDS is a failure. A
//  route that 500s on a database blip is therefore a route that gets itself
//  unsubscribed — which is exactly what kept happening here, about seven
//  times, each one ending with someone re-creating the webhook by hand.
//
//  So: verify the signature, acknowledge 200, and do every bit of real work
//  in `after()`, which runs once the response has been sent. Nothing below
//  the acknowledgement can affect the status code any more.
//
//  The only non-200s left are 401 (bad signature — a real security answer)
//  and 503 (no secret configured at all, i.e. nothing could ever verify).
// ─────────────────────────────────────────────────────────────────────────
//
// SETUP (one-time, in Shopify admin):
//   Settings → Notifications → Webhooks → Create webhook
//     Event:   Order creation      Format: JSON
//     URL:     https://townies.shop/api/webhooks/shopify/orders
//   Then copy the signing secret shown at the bottom of that page into
//   SHOPIFY_WEBHOOK_SECRET. Without it this route rejects everything, which is
//   the correct failure mode for an unauthenticated public endpoint.

import type { NextRequest } from 'next/server';
import { after } from 'next/server';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { markSpinCodeRedeemed } from '@/lib/townies/spin-redemption';
import { lineBrand, type ShopifyLineItem } from '@/lib/shopify/orders-source';
import type { RealBrand } from '@/lib/admin/brand';
import { verifyWebhook } from '@/lib/shopify/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WebhookOrder = {
  id?: number;
  email?: string | null;
  contact_email?: string | null;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  line_items?: ShopifyLineItem[];
  /** Present on every order; empty when nothing was applied. */
  discount_codes?: { code?: string | null }[];
  /** Lets lineBrand date-resolve a line that carries no `_brand` attribute. */
  created_at?: string | null;
};

export async function POST(req: NextRequest) {
  // Both secrets are checked (admin-UI subscriptions sign with one, app-owned
  // API subscriptions with the other), so this works whichever way the
  // subscription was created.
  if (!process.env.SHOPIFY_WEBHOOK_SECRET && !process.env.SHOPIFY_CLIENT_SECRET) {
    console.error('[shopify-webhook] no signing secret configured — rejecting.');
    return new Response('Webhook not configured', { status: 503 });
  }

  // HMAC is over the RAW bytes. Re-serialising the parsed JSON changes key
  // order and whitespace and the signature stops matching, which is why this
  // reads text() and parses afterwards.
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get('x-shopify-hmac-sha256'))) {
    // Do not describe why. An attacker probing the endpoint learns nothing.
    return new Response('Unauthorized', { status: 401 });
  }

  let order: WebhookOrder;
  try {
    order = JSON.parse(raw) as WebhookOrder;
  } catch {
    // Malformed and will be malformed on every retry — acknowledge it.
    return Response.json({ ok: true, skipped: 'unparseable payload' });
  }

  // Everything from here runs AFTER the 200 has gone back to Shopify, so no
  // amount of slow database can turn into a delivery timeout. Nothing in here
  // can change the status code; failures are logged and picked up by the
  // manual Sync button, which writes through the same upsertContact.
  after(async () => {
    const email = order.email || order.contact_email;
    if (!email) return; // Guest/POS order with no email — nothing to capture.

    const name =
      [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ') || undefined;

    const brands: RealBrand[] = [
      ...new Set((order.line_items ?? []).map((li) => lineBrand(li, order.created_at))),
    ];

    try {
      if (brands.length === 0) {
        // Nothing to read a brand from — a POS or manual order. This is the
        // Townies store now, so tag it Townies rather than leaving the person
        // untagged and invisible to every brand-scoped segment.
        await upsertContact({ email, name, source: 'order', brand: 'townies' });
      } else {
        for (const brand of brands) {
          await upsertContact({ email, name, source: 'order', brand });
        }
      }
    } catch (err) {
      console.error('[shopify-webhook] contact upsert failed', err);
    }

    // Rotary spin attribution — nice to know rather than load-bearing. Its own
    // try because an unhandled throw here used to escape the route entirely and
    // produce the 500 this whole rewrite exists to avoid.
    try {
      await markSpinCodeRedeemed(
        (order.discount_codes ?? []).map((d) => d?.code).filter((c): c is string => Boolean(c)),
        order.id != null ? String(order.id) : null,
      );
    } catch (err) {
      console.error('[shopify-webhook] spin attribution failed', err);
    }
  });

  return Response.json({ ok: true });
}
