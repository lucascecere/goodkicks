// Date and money formatting for the admin.
//
// These existed as 14 near-copies across 10 files, and they were NOT identical:
// the dashboard omitted the year, the rep detail page spelled the weekday out,
// the sales table rendered a null date as '—' while the partner panel rendered
// it as 'No orders yet', and money was 0-decimal in one place and 2-decimal in
// two others. So this keeps every distinct shape rather than flattening them —
// consolidating them into one format would have silently changed the UI.

const TZ_NOTE = 'en-US';

/** The business runs on Massachusetts time. Without this, dates rendered on
 *  the server came out in UTC (an evening order read as the next day) and then
 *  differed from the browser's render, a hydration error (2026-10-09 audit). */
const TZ = 'America/New_York';

/** "Aug 23, 2026" — the dominant admin date. */
export function fmtDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Aug 23" — no year. Dashboard lists, where the year is noise. */
export function fmtDateShort(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, {
    timeZone: TZ, month: 'short', day: 'numeric' });
}

/** "Saturday, August 23, 2026" — the rep detail header. */
export function fmtDateLong(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * "Aug 23, 4:05 PM", or "Aug 23, 2026, 4:05 PM" with `year: true`.
 * The roster drops the year (recent activity); the onboarding panel keeps it
 * (a welcome email sent last season should not read as this week).
 */
export function fmtDateTime(
  iso: string | null | undefined,
  { year = false, fallback = '—' }: { year?: boolean; fallback?: string } = {},
): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleString(TZ_NOTE, {
    timeZone: TZ,
    month: 'short',
    day: 'numeric',
    ...(year ? { year: 'numeric' as const } : {}),
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * "$1,234.56", or "$1,235" with `decimals: 0`.
 * Rep earnings need the cents — they are literally what someone is owed. The
 * dashboard's headline revenue figure does not.
 */
export function money(n: number, { decimals = 2 }: { decimals?: 0 | 2 } = {}): string {
  return new Intl.NumberFormat(TZ_NOTE, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    ...(decimals === 0 ? { maximumFractionDigits: 0 } : {}),
  }).format(n);
}

// ── Campaign scheduling: wall-clock Massachusetts time <-> UTC ──────────────
// A <input type="datetime-local"> has no zone. The scheduler types Boston time
// whatever zone the browser is in, and the DB stores UTC.

/** Milliseconds America/New_York is ahead of UTC at `date` (negative: -4h/-5h). */
function easternOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - date.getTime();
}

/** "2026-12-04T10:00" read as Boston time → UTC ISO string, or null if malformed. */
export function easternLocalToUtcIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Two passes so a time near a DST switch picks up the offset in force then.
  let utc = naive - easternOffsetMs(new Date(naive));
  utc = naive - easternOffsetMs(new Date(utc));
  return new Date(utc).toISOString();
}

/** UTC ISO → "2026-12-04T10:00" in Boston time, for a datetime-local input. */
export function utcToEasternLocal(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() + easternOffsetMs(d));
  return local.toISOString().slice(0, 16);
}

/** "Thu Dec 4, 10:00 AM ET" — a scheduled send time. */
export function fmtScheduled(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  const day = d.toLocaleDateString(TZ_NOTE, { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(TZ_NOTE, { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
  return `${day.replace(',', '')}, ${time} ET`;
}
