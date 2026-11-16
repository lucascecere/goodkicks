import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendEmail } from '@/lib/email/resend-client';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';

// Where spam goes instead of the inbox, and the hourly burst cap.
// Table: form_spam (docs/migrations/2026-11-16_form_spam.sql). Never throws.

export async function quarantine(row: {
  form: string;
  brand?: string | null;
  name?: string | null;
  email?: string | null;
  reasons: string[];
  payload?: Record<string, unknown>;
}): Promise<void> {
  console.warn('[FORM_SPAM]', row.form, row.reasons.join(', '), row.email ?? '');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { error } = await createSupabaseServiceClient()
      .from('form_spam')
      .insert({
        form: row.form,
        brand: row.brand ?? null,
        name: row.name ? String(row.name).slice(0, 200) : null,
        email: row.email ? String(row.email).slice(0, 200) : null,
        reasons: row.reasons,
        payload: row.payload ?? null,
      });
    if (error) console.error('[FORM_SPAM] save failed', error.message);
  } catch (err) {
    console.error('[FORM_SPAM] save failed', err);
  }
}

// The lead forms (contact, custom quote, rep applications, market applications)
// have never passed 3 in an hour. More than this many real-looking leads in an
// hour means a bot is getting past the checks: hold the rest and alert Lucas.
export const BURST_LIMIT_PER_HOUR = 6;
const SPAM_ALERT_EMAIL = process.env.SPAM_ALERT_EMAIL || 'lucas@yourwebsitefriend.com';

/**
 * True when this lead should be held as spam because of a burst. Counts the
 * last hour of real leads in the database, so it holds across server
 * instances, and emails Lucas once per burst (the first hold in the hour).
 */
export async function burstHold(form: string, who: { name?: string; email?: string; brand?: string }, payload: Record<string, unknown>): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const db = createSupabaseServiceClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [cs, aa, held] = await Promise.all([
      db.from('contact_submissions').select('id', { count: 'exact', head: true }).gte('created_at', since),
      db.from('ambassador_applications').select('id', { count: 'exact', head: true }).gte('created_at', since),
      db.from('form_spam').select('id', { count: 'exact', head: true }).gte('created_at', since).contains('reasons', ['burst']),
    ]);
    const real = (cs.count ?? 0) + (aa.count ?? 0);
    if (real < BURST_LIMIT_PER_HOUR) return false;

    await quarantine({ form, brand: who.brand, name: who.name, email: who.email, reasons: ['burst'], payload });
    if ((held.count ?? 0) === 0) {
      try {
        await sendEmail({
          from: TOWNIES_FROM,
          to: SPAM_ALERT_EMAIL,
          subject: `Townies forms: ${real}+ leads in the last hour, holding the rest`,
          html: `<p>The Townies / Good Kicks forms passed ${real} leads in the last hour, which looks like a bot getting past the spam checks.</p><p>New submissions are being held in the <b>form_spam</b> table (no email to the inbox, no autoresponder, no codes) until the rate drops.</p>`,
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
