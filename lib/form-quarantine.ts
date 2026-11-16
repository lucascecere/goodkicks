import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { sendEmail } from '@/lib/email/resend-client';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';
import { after } from 'next/server';
import { definiteBot } from '@/lib/form-guard';
import { holdLead, leadSiteFor, reportSpamCount } from '@/lib/lead-monitor';

// Spam v2 (2026-11-16, Lucas: spam flags must never block real customer data).
// quarantine() returns true when the submission is handled and must NOT be
// delivered; false means "deliver it as a normal lead".
//   - DEFINITE bot (honeypot, no/forged/instant token, gibberish, faker company
//     + stolen address, disposable or no-MX domain): refused, nothing stored,
//     one bump in spam_counts (day, site, reason; no PII) + the CC count.
//   - Content-only doubt on a lead form (pitch wording, scam signs, burst):
//     HELD for review in the Command Center with the exact inbox alert, so a
//     Release there sends it. Not saved here, nobody emailed.
//   - Content-only on a non-lead form (review, spin, newsletter), or a hold CC
//     could not take: false, so the caller delivers it. Never dropped.

const LEAD_FORMS = /^(contact|custom hat quote|market application|rep application)/;

export async function quarantine(row: {
  form: string;
  brand?: string | null;
  name?: string | null;
  email?: string | null;
  reasons: string[];
  payload?: Record<string, unknown>;
}): Promise<boolean> {
  const reasons = [
    ...new Set(
      (row.reasons ?? [])
        .map((r) => String(r ?? '').replace(/\d+(?:\.\d+)?/g, 'n').replace(/\s+/g, ' ').trim().slice(0, 80))
        .filter((r) => r && r !== 'all'),
    ),
  ].slice(0, 12);
  const brand = row.brand === 'goodkicks' ? 'goodkicks' : 'townies';
  if (definiteBot(row.reasons ?? [])) {
    console.warn('[FORM_SPAM]', brand, row.form, reasons.join('; '));
    await countRefusal(brand, reasons);
    after(() => reportSpamCount(leadSiteFor(brand), reasons));
    return true;
  }
  if (!LEAD_FORMS.test(row.form)) return false;
  const payload = row.payload ?? {};
  const summary = Object.entries(payload)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  const held = await holdLead({
    site: leadSiteFor(brand),
    name: row.name ?? null,
    email: row.email ?? null,
    company: typeof payload.company === 'string' ? payload.company : typeof payload.groupName === 'string' ? payload.groupName : null,
    phone: typeof payload.phone === 'string' ? payload.phone : null,
    form: row.form,
    summary,
    reasons,
    alert: alertFor(brand, row.form, row.name ?? row.email ?? 'someone', row.email),
  });
  console.warn(held ? '[FORM_HELD]' : '[FORM_HOLD_FAILED_DELIVERING]', brand, row.form, reasons.join('; '));
  return held;
}

// How the inbox alert for this form goes out, for a Release in CC. Townies
// mail ONLY from info@townies.shop (hard rule); Townies rep/market/contact
// alerts go to info@townies.shop, Good Kicks keeps info@goodkicks.co.
function alertFor(brand: 'townies' | 'goodkicks', form: string, who: string, email: string | null | undefined) {
  const to = brand === 'townies' ? 'info@townies.shop' : process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co';
  return {
    from: brand === 'townies' ? TOWNIES_FROM : 'Good Kicks <info@goodkicks.co>',
    to: [to],
    ...(email ? { reply_to: email } : {}),
    subject: `New ${form} (released from review): ${who}`,
  };
}

async function countRefusal(site: string, reasons: string[]): Promise<void> {
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

    // Held for review in CC (never dropped: it could be a real rush). The
    // 'burst' count row is what makes the alert below go out once per burst.
    await countRefusal(who.brand === 'goodkicks' ? 'goodkicks' : 'townies', ['burst']);
    const handled = await quarantine({ form, brand: who.brand, name: who.name, email: who.email, reasons: ['burst'], payload });
    if ((held.count ?? 0) === 0) {
      try {
        await sendEmail({
          from: TOWNIES_FROM,
          to: SPAM_ALERT_EMAIL,
          subject: `Townies forms: ${real}+ leads in the last hour, holding the rest for review`,
          html: `<p>The Townies / Good Kicks forms passed ${real} leads in the last hour, which looks like a bot getting past the spam checks.</p><p>New submissions are being held for review in the Command Center (Websites, Held for review) until the rate drops: nothing saved on the site, no email to the inbox, no autoresponder, no codes. Release any that are real.</p>`,
        });
      } catch (err) {
        console.error('[BURST_ALERT_FAILED]', err);
      }
    }
    return handled;
  } catch (err) {
    console.error('[burst] check failed', err);
    return false; // never lose a real lead over the guard itself
  }
}
