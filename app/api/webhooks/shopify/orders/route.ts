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
// SETUP (one-time, in Shopify admin):
//   Settings → Notifications → Webhooks → Create webhook
//     Event:   Order creation      Format: JSON
//     URL:     https://townies.shop/api/webhooks/shopify/orders
//   Then copy the signing secret shown at the bottom of that page into
//   SHOPIFY_WEBHOOK_SECRET. Without it this route rejects everything, which is
//   the correct failure mode for an unauthenticated public endpoint.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { lineBrand, type ShopifyLineItem } from '@/lib/shopify/orders-source';
import type { RealBrand } from '@/lib/admin/brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type WebhookOrder = {
  id?: number;
  email?: string | null;
  contact_email?: string | null;
  customer?: { first_name?: string | null; last_name?: string | null } | null;
  line_items?: ShopifyLineItem[];
};

/**
 * Verify Shopify's HMAC over the RAW body.
 *
 * Must be the exact bytes received — re-serialising the parsed JSON changes key
 * order and whitespace, and the signature stops matching. That's why this route
 * reads text() and parses afterwards.
 */
function verify(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const digest = createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');

  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(header, 'utf8');
  // timingSafeEqual throws on length mismatch, so guard before comparing —
  // and compare rather than using === so the check stays constant-time.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[shopify-webhook] SHOPIFY_WEBHOOK_SECRET is not set — rejecting.');
    return new Response('Webhook not configured', { status: 503 });
  }

  const raw = await req.text();
  if (!verify(raw, req.headers.get('x-shopify-hmac-sha256'), secret)) {
    // Do not describe why. An attacker probing the endpoint learns nothing.
    return new Response('Unauthorized', { status: 401 });
  }

  let order: WebhookOrder;
  try {
    order = JSON.parse(raw) as WebhookOrder;
  } catch {
    return new Response('Bad payload', { status: 400 });
  }

  const email = order.email || order.contact_email;
  if (!email) {
    // Guest/POS orders without an email aren't a failure — acknowledge so
    // Shopify doesn't retry forever.
    return Response.json({ ok: true, skipped: 'no email' });
  }

  const name =
    [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ') || undefined;

  const brands: RealBrand[] = [...new Set((order.line_items ?? []).map(lineBrand))];

  try {
    if (brands.length === 0) {
      // No line items to read a brand from — still capture the person.
      await upsertContact({ email, name, source: 'order' });
    } else {
      for (const brand of brands) {
        await upsertContact({ email, name, source: 'order', brand });
      }
    }
  } catch (err) {
    // A 500 makes Shopify retry with backoff, which is what we want for a
    // transient database blip.
    console.error('[shopify-webhook] contact upsert failed', err);
    return new Response('Upsert failed', { status: 500 });
  }

  return Response.json({ ok: true, brands });
}
