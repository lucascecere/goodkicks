// The rep percentage rule, in one place.
//
// `MAX_PCT = 20` and its 0–20 validation were written out five times — twice in
// the two rep UIs and three times across the API routes — which is four chances
// for the cap to drift away from the database CHECK constraints
// (commission_pct_range / discount_pct_range, both 0..20). Raising the cap
// should be one edit here plus one migration, not a grep.
//
// Client-safe: no server imports, so both the admin UI and the route handlers
// use the same numbers.

/** Ceiling for both commission and customer discount. Matches the DB CHECKs. */
export const MAX_PCT = 20;

/**
 * Whole number within range. `min` is 0 for commission (a 0% rep is legitimate —
 * a friend of the brand who just wants a code) and 1 for a discount code, where
 * 0% off would mint a code that does nothing.
 */
export function isValidPct(value: unknown, min = 0): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_PCT;
}

/** Clamp free typing in a number input to a whole, in-range percentage. */
export function clampPct(n: number): number {
  return Number.isFinite(n) ? Math.max(0, Math.min(MAX_PCT, Math.round(n))) : 0;
}
