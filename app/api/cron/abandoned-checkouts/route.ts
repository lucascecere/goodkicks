// Hourly: one recovery email per abandoned Townies checkout.
//
// ────────────────────────────────────────────────────────────────────────────
//  OFF BY DEFAULT. Nothing is sent or minted unless ABANDONED_EMAILS_ENABLED=1
//  is set in the Vercel env. Without it the route reports exactly who it WOULD
//  email and with what. Add `?dry=1` to force that even once it's live.
// ────────────────────────────────────────────────────────────────────────────
//
// Who: checkouts 1 to 48 hours old with an email, never completed, with at
// least one Townies line, whose email hasn't ordered since and isn't
// unsubscribed (lib/shopify/abandoned-checkouts.ts).
// What: 2+ hats → the two-town deal already prices them at $25 each (BACK5
// wouldn't stack with it), so a reminder that says the deal is still on. Else
// no promo on the checkout → a one-use BACK5 code ($5 off, 7 days) that the
// link applies automatically. Already had a promo → a plain reminder.
// Once: abandoned_checkout_emails.checkout_id is unique, and the row is claimed
// BEFORE minting or sending, so two overlapping runs can't double-send.

import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { listRecoverableCheckouts, orderedSince, recoveryLink } from '@/lib/shopify/abandoned-checkouts';
import { mintBack5Code } from '@/lib/shopify/create-back5-code';
import { sendAbandonedCheckoutEmail, abandonedSubject } from '@/lib/email/send-abandoned-checkout';
import { dealApplies } from '@/lib/townies/two-town-deal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_PER_RUN = 20;

type Planned = {
  checkout: string;
  email: string;
  createdAt: string;
  offer: 'back5' | 'reminder';
  /** 2+ hats: the two-town deal applies at checkout, so say so instead of minting BACK5. */
  deal: boolean;
  subject: string;
  items: string[];
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('Cron not configured', { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1' || process.env.ABANDONED_EMAILS_ENABLED !== '1';
  const db = createSupabaseServiceClient();

  let checkouts;
  try {
    checkouts = await listRecoverableCheckouts();
  } catch (err) {
    console.error('[abandoned] Shopify read failed:', err);
    return Response.json({ ok: false, error: 'could not read Shopify abandoned checkouts' }, { status: 200 });
  }

  // Already emailed (any status: one email per checkout, ever).
  const ids = checkouts.map((c) => c.id);
  const done = new Set<string>();
  if (ids.length) {
    const { data, error } = await db.from('abandoned_checkout_emails').select('checkout_id').in('checkout_id', ids);
    if (error) {
      console.error('[abandoned] dedupe read failed:', error.message);
      return Response.json({ ok: false, error: 'could not read abandoned_checkout_emails' }, { status: 200 });
    }
    for (const r of data ?? []) done.add(r.checkout_id as string);
  }

  // Unsubscribed addresses.
  const emails = [...new Set(checkouts.map((c) => c.email))];
  const unsub = new Set<string>();
  if (emails.length) {
    const { data, error } = await db.from('contacts').select('email').in('email', emails).not('unsubscribed_at', 'is', null);
    if (error) {
      console.error('[abandoned] unsubscribe read failed:', error.message);
      return Response.json({ ok: false, error: 'could not read contacts' }, { status: 200 });
    }
    for (const r of data ?? []) unsub.add(String(r.email).toLowerCase());
  }

  const skipped: { checkout: string; reason: string }[] = [];
  const planned: (Planned & { c: (typeof checkouts)[number] })[] = [];
  for (const c of checkouts) {
    if (done.has(c.id)) { skipped.push({ checkout: c.id, reason: 'already emailed' }); continue; }
    if (unsub.has(c.email)) { skipped.push({ checkout: c.id, reason: 'unsubscribed' }); continue; }
    // Ordered after the checkout, or in the day before it (a second checkout
    // opened right after paying, seen 2026-11-17), means don't nag a buyer.
    const since = new Date(new Date(c.createdAt).getTime() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
    if (await orderedSince(c.email, since)) { skipped.push({ checkout: c.id, reason: 'ordered recently' }); continue; }
    // The same person can leave two checkouts in a row; email the newest only.
    if (planned.some((p) => p.email === c.email)) { skipped.push({ checkout: c.id, reason: 'newer checkout for same email' }); continue; }
    const deal = dealApplies(c.hatUnits);
    const hasOffer = !deal && c.discountCodes.length === 0;
    planned.push({
      c,
      checkout: c.id,
      email: c.email,
      createdAt: c.createdAt,
      offer: hasOffer ? 'back5' : 'reminder',
      deal,
      subject: abandonedSubject(c.lines, hasOffer, deal),
      items: c.lines.map((l) => `${l.title}${l.quantity > 1 ? ` x${l.quantity}` : ''}`),
    });
  }

  const batch = planned.slice(0, MAX_PER_RUN);
  const view = (p: Planned) => ({ checkout: p.checkout, email: p.email, createdAt: p.createdAt, offer: p.deal ? 'deal' : p.offer, subject: p.subject, items: p.items });

  if (dry) {
    return Response.json({
      ok: true,
      dryRun: true,
      reason: process.env.ABANDONED_EMAILS_ENABLED === '1' ? '?dry=1' : 'ABANDONED_EMAILS_ENABLED is not 1, set it to start sending',
      eligible: checkouts.length,
      wouldSend: batch.map(view),
      skipped,
    });
  }

  const results: { checkout: string; status: string; code?: string; resendId?: string; error?: string }[] = [];
  for (const p of batch) {
    const c = p.c;
    // Claim first. A unique-violation means another run got here: skip.
    const { error: claimErr } = await db.from('abandoned_checkout_emails').insert({
      checkout_id: c.id,
      email: c.email,
      checkout_created_at: c.createdAt,
      offer: p.offer,
      status: 'claimed',
    });
    if (claimErr) {
      results.push({ checkout: c.id, status: 'skipped', error: claimErr.code === '23505' ? 'claimed by another run' : claimErr.message });
      continue;
    }

    try {
      const minted = p.offer === 'back5' ? await mintBack5Code() : null;
      if (minted) {
        await db.from('abandoned_checkout_emails').update({ code: minted.code, code_gid: minted.gid }).eq('checkout_id', c.id);
      }
      const resendId = await sendAbandonedCheckoutEmail({
        to: c.email,
        firstName: c.firstName,
        lines: c.lines,
        link: recoveryLink(c.recoveryUrl, minted?.code ?? null),
        offer: minted ? { code: minted.code, expiresAt: minted.expiresAt } : null,
        deal: p.deal,
      });
      await db.from('abandoned_checkout_emails')
        .update({ status: 'sent', resend_id: resendId, sent_at: new Date().toISOString() })
        .eq('checkout_id', c.id);
      results.push({ checkout: c.id, status: 'sent', code: minted?.code, resendId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[abandoned] send failed for', c.id, msg);
      // Left as failed, not retried: better one missed email than two sent.
      await db.from('abandoned_checkout_emails').update({ status: 'failed', error: msg.slice(0, 500) }).eq('checkout_id', c.id);
      results.push({ checkout: c.id, status: 'failed', error: msg });
    }
  }

  return Response.json({ ok: true, dryRun: false, eligible: checkouts.length, results, skipped, deferred: planned.length - batch.length });
}
