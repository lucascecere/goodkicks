// Date and money formatting for the admin.
//
// These existed as 14 near-copies across 10 files, and they were NOT identical:
// the dashboard omitted the year, the rep detail page spelled the weekday out,
// the sales table rendered a null date as '—' while the partner panel rendered
// it as 'No orders yet', and money was 0-decimal in one place and 2-decimal in
// two others. So this keeps every distinct shape rather than flattening them —
// consolidating them into one format would have silently changed the UI.

const TZ_NOTE = 'en-US';

/** "Aug 23, 2026" — the dominant admin date. */
export function fmtDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Aug 23" — no year. Dashboard lists, where the year is noise. */
export function fmtDateShort(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, { month: 'short', day: 'numeric' });
}

/** "Saturday, August 23, 2026" — the rep detail header. */
export function fmtDateLong(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString(TZ_NOTE, {
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
