import 'server-only';

// Reports every real (non-spam) lead to the YWF Command Center, with whether
// the inbox alert email actually went out. If it didn't, the CC alarms Lucas
// within minutes. Same contract as the ACoast site (src/services/lead-monitor.ts).
//
// Best-effort by design: it never throws and times out fast, and callers run
// it inside after(), so it can never block or fail a form.
// Env: LEAD_EVENT_URL (the CC endpoint) + LEAD_EVENT_SECRET (this site's key).
// Townies and Good Kicks are separate CC sites with separate keys:
// LEAD_EVENT_SECRET_TOWNIES / LEAD_EVENT_SECRET_GOODKICKS.

export type LeadSite = 'townies' | 'good-kicks';

export function leadSiteFor(brand: string | null | undefined): LeadSite {
  return brand === 'goodkicks' ? 'good-kicks' : 'townies';
}

export async function reportLead(input: {
  site: LeadSite;
  externalId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  form: string;
  summary: string;
  clientNotified: boolean;
  notifyError: string | null;
}): Promise<void> {
  const url = process.env.LEAD_EVENT_URL;
  const key = input.site === 'good-kicks' ? process.env.LEAD_EVENT_SECRET_GOODKICKS : process.env.LEAD_EVENT_SECRET_TOWNIES;
  if (!url || !key) {
    console.warn('[LEAD_MONITOR] LEAD_EVENT_URL / site key not set, lead not reported');
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'x-lead-site': input.site },
      body: JSON.stringify({
        site: input.site,
        external_id: input.externalId ?? undefined,
        occurred_at: new Date().toISOString(),
        name: input.name,
        email: input.email,
        phone: input.phone || undefined,
        company: input.company || undefined,
        form: input.form,
        summary: input.summary.slice(0, 4000),
        client_notified: input.clientNotified,
        notify_error: input.notifyError,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error('[LEAD_MONITOR_FAILED]', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.error('[LEAD_MONITOR_FAILED]', err);
  }
}

/** Run a send and capture whether it worked, for client_notified. */
export async function captureSend(send: () => Promise<unknown>): Promise<{ ok: boolean; error: string | null }> {
  try {
    await send();
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
