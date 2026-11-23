// Every 15 minutes: send campaigns whose scheduled time has come.
//
// Picks drafts with scheduled_for <= now() and sends each through the same
// sendCampaign() the admin Send button uses (lib/email/send-campaign.ts), so a
// scheduled send behaves exactly like a manual one. sendCampaign claims the row
// first (draft -> 'sending', only while still due), so overlapping runs or a
// simultaneous click can't double-send, and a schedule cancelled between the
// list and the claim is skipped.
//
// Nothing went out:
//   - a problem with the campaign itself (no matching contacts, deleted) ->
//     back to draft, schedule cleared, schedule_error says why.
//   - a transient failure (Shopify buyer check down, Resend refused everything)
//     -> back to draft, schedule KEPT so the next run retries, schedule_error
//     notes it. After RETRY_WINDOW_MS past the scheduled time it gives up and
//     clears the schedule, so a campaign never goes out a day late by surprise.

import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendCampaign } from '@/lib/email/send-campaign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MAX_PER_RUN = 5;
const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('Cron not configured', { status: 503 });
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const { data: due, error } = await db
    .from('campaigns')
    .select('id, name, scheduled_for')
    .eq('status', 'draft')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(MAX_PER_RUN);
  if (error) {
    console.error('[scheduled-campaigns] list failed:', error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ id: string; name: string; outcome: string }> = [];
  for (const c of due ?? []) {
    const res = await sendCampaign(c.id, { dueBy: now });
    if (res.ok) {
      results.push({ id: c.id, name: c.name, outcome: `sent ${res.sent}, failed ${res.failed}` });
      continue;
    }
    if (res.status === 409) {
      // Lost the claim: someone else sent it, or it was cancelled/moved.
      results.push({ id: c.id, name: c.name, outcome: 'skipped (no longer due)' });
      continue;
    }
    const late = Date.now() - new Date(c.scheduled_for as string).getTime() > RETRY_WINDOW_MS;
    const giveUp = !res.transient || late;
    const note = `${new Date().toISOString()}: ${res.error}${giveUp ? ' Schedule cancelled.' : ' Retrying next run.'}`;
    const { error: noteErr } = await db
      .from('campaigns')
      .update({ schedule_error: note, ...(giveUp ? { scheduled_for: null } : {}) })
      .eq('id', c.id)
      .eq('status', 'draft');
    if (noteErr) console.error('[scheduled-campaigns] could not note error on', c.id, noteErr.message);
    console.error('[scheduled-campaigns]', c.id, res.error);
    results.push({ id: c.id, name: c.name, outcome: `not sent: ${res.error}${giveUp ? ' (schedule cleared)' : ' (will retry)'}` });
  }

  return Response.json({ ok: true, checkedAt: now, results });
}
