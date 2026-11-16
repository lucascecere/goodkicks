import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendEmail } from '@/lib/email/resend-client';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';

// Spam is REFUSED, never stored (Lucas 2026-11-16: "make sure the bot spam
// contacts dont get through or hold space/storage on site, same way bookings
// refuses spam"). A refused submission writes no row: only one aggregate bump
// in spam_counts (Eastern day, site, reason, count; no name, email, phone or
// message) via the bump_spam_counts RPC, and one [FORM_SPAM] log line with the
// form and reasons. Replaces the old form_spam table. Never throws.
//
// The name/email/payload fields are still accepted so the callers compile;
// they are deliberately ignored.

export async function quarantine(row: {
  form: string;
  brand?: string | null;
  name?: string | null;
  email?: string | null;
  reasons: string[];
  payload?: Record<string, unknown>;
}): Promise<void> {
  const reasons = [
    ...new Set(
      (row.reasons ?? [])
        .map((r) => String(r ?? '').replace(/\d+(?:\.\d+)?/g, 'n').replace(/\s+/g, ' ').trim().slice(0, 80))
        .filter((r) => r && r !== 'all'),
    ),
  ].slice(0, 12);
  const site = row.brand === 'goodkicks' ? 'goodkicks' : 'townies';
  console.warn('[FORM_SPAM]', site, row.form, reasons.join('; '));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { error } = await createSupabaseServiceClient().rpc('bump_spam_counts', { p_site: site, p_reasons: reasons });
    if (error) console.error('[FORM_SPAM] count failed', error.message);
  } catch (err) {
    console.error('[FORM_SPAM] count failed', err);
  }
}

// The lead forms (contact, custom quote, rep applications, market applications)
// have never passed 3 in an hour. More than this many real-looking leads in an
// hour means a bot is getting past the checks: refuse the rest and alert Lucas.
export const BURST_LIMIT_PER_HOUR = 6;
const SPAM_ALERT_EMAIL = process.env.SPAM_ALERT_EMAIL || 'lucas@yourwebsitefriend.com';

/**
 * True when this lead should be refused as spam because of a burst. Counts the
 * last hour of real leads in the database, so it holds across server
 * instances, and emails Lucas once per burst (the first refusal in the hour).
 */
export async function burstHold(form: string, who: { name?: string; email?: string; brand?: string }, payload: Record<string, unknown>): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const db = createSupabaseServiceClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [cs, aa, held] = await Promise.all([
      db.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('created_at', since),
      db.from('ambassador_applications').select('id', { count: 'exact', head: true }).gte('created_at', since),
      db.from('spam_counts').select('day', { count: 'exact', head: true }).eq('reason', 'burst').gte('last_at', since),
    ]);
    const real = (cs.count ?? 0) + (aa.count ?? 0);
    if (real < BURST_LIMIT_PER_HOUR) return false;

    await quarantine({ form, brand: who.brand, name: who.name, email: who.email, reasons: ['burst'], payload });
    if ((held.count ?? 0) === 0) {
      try {
        await sendEmail({
          from: TOWNIES_FROM,
          to: SPAM_ALERT_EMAIL,
          subject: `Townies forms: ${real}+ leads in the last hour, refusing the rest`,
          html: `<p>The Townies / Good Kicks forms passed ${real} leads in the last hour, which looks like a bot getting past the spam checks.</p><p>New submissions are being refused until the rate drops: nothing saved, no email to the inbox, no autoresponder, no codes. Only a count is kept (spam_counts, reason "burst").</p>`,
        });
      } catch (err) {
        console.error('[BURST_ALERT_FAILED]', err);
      }
    }
    return true;
  } catch (err) {
    console.error('[burst] check failed', err);
    return false; // never lose a real lead over the guard itself
  }
}
