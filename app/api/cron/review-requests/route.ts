// Daily: send the review requests that have come due.
//
// ────────────────────────────────────────────────────────────────────────────
//  OFF BY DEFAULT. Nothing is sent unless REVIEW_REQUESTS_ENABLED=1 is set in
//  the Vercel env. Without it this route still runs, still reports exactly who
//  it WOULD have emailed, and sends nothing — so the queue can be wired up and
//  watched for a week before a single customer hears from us.
//  Add `?dry=1` to force that behaviour even once it's live.
// ────────────────────────────────────────────────────────────────────────────
//
// Only asks for orders fulfilled since the queue started, one per order, seven
// days after the parcel shipped. There is no path in here that mails a back
// catalogue — `review_requests` rows are written solely by the fulfilment
// webhook, and every row is marked sent the moment it goes out.
//
// It ALSO repairs the Shopify webhook subscriptions on every run. Shopify
// deletes a subscription after repeated delivery failures and tells nobody in
// band, which is how these have gone missing roughly seven times. Checking
// daily means the worst case is under 24 hours of missed deliveries, repaired
// without anyone opening Shopify. This runs before the sending and regardless
// of whether sending is enabled — the repair is the more important half.

import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendReviewRequestEmail } from '@/lib/email/send-review-request';
import { reconcileWebhooks } from '@/lib/shopify/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** A ceiling per run, so a backlog trickles out instead of arriving at once. */
const MAX_PER_RUN = 40;

type DueRow = {
  id: string;
  email: string;
  name: string | null;
  brand: string;
  product_title: string | null;
  token: string;
  send_after: string;
};

export async function GET(req: NextRequest) {
  // Vercel Cron signs its calls with CRON_SECRET as a bearer token. Rejecting
  // without it keeps this from being a public "email my customers" button.
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('Cron not configured', { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Repair first, and never let it stop the send. A Shopify outage must not
  // also hold up the emails.
  let webhooks;
  try {
    webhooks = await reconcileWebhooks();
    if (webhooks.created.length > 0) {
      console.warn('[cron] re-created Shopify webhooks:', webhooks.created.join(', '));
    }
    if (webhooks.failed.length > 0) {
      console.error('[cron] webhook repair failed:', JSON.stringify(webhooks.failed));
    }
  } catch (err) {
    console.error('[cron] webhook repair threw:', err);
    webhooks = { ok: false, present: [], created: [], failed: [{ topic: '*', error: String(err) }] };
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1'
    || process.env.REVIEW_REQUESTS_ENABLED !== '1';

  const db = createSupabaseServiceClient();
  const { data, error } = await db
    .from('review_requests')
    .select('id, email, name, brand, product_title, token, send_after')
    .is('sent_at', null)
    .lte('send_after', new Date().toISOString())
    .order('send_after', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error('[review-cron] read failed:', error.message);
    // The webhook repair above already happened and is the load-bearing half,
    // so report it rather than throwing the whole run away.
    return Response.json({ ok: false, webhooks, error: 'could not read queue' }, { status: 200 });
  }

  const due = (data ?? []) as DueRow[];
  if (dry) {
    return Response.json({
      ok: true,
      webhooks,
      dryRun: true,
      reason:
        process.env.REVIEW_REQUESTS_ENABLED === '1'
          ? '?dry=1'
          : 'REVIEW_REQUESTS_ENABLED is not 1 — set it to start sending',
      wouldSend: due.length,
      recipients: due.map((r) => ({ email: r.email, brand: r.brand, due: r.send_after })),
    });
  }

  let sent = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const row of due) {
    try {
      const messageId = await sendReviewRequestEmail({
        to: row.email,
        name: row.name,
        brand: row.brand,
        productTitle: row.product_title,
        token: row.token,
      });
      // Marked sent ONLY after Resend returns an id. sendEmail throws on a
      // rejected send rather than resolving quietly, so a failure here leaves
      // the row due and the next run retries it — the one thing that must not
      // happen is marking a row sent for an email that never left.
      await db
        .from('review_requests')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', row.id);
      sent += 1;
      void messageId;
    } catch (err) {
      failures.push({ email: row.email, error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (failures.length) console.error('[review-cron] failures:', JSON.stringify(failures));
  return Response.json({ ok: true, webhooks, due: due.length, sent, failed: failures.length });
}
