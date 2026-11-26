// Black Friday weekend 2026 (Lucas 11-26): $10 off every IN-STOCK hat except
// Charlestown (pre-order hats and Charlestown are not in the sale), Fri Nov 27
// 12:00am to Sun Nov 29 11:59pm ET. Shipping works as normal (free over $75).
//
// The discount itself is a Shopify AUTOMATIC discount (gid://shopify/
// DiscountAutomaticNode/1242225016987): $10 off each item in the SMART
// collection `black-friday-hats` (type Hats AND inventory > 0 AND title not
// containing Charlestown), scheduled for exactly this window. A hat that sells
// out mid-weekend drops out of the collection (and goes pre-order) by itself. It
// combines with shipping discounts only, so it beats the two-town deal ($4.99)
// and replaces HELLO5 / BACK5 rather than stacking.
//
// Everything on the site that shows the sale reads THIS file: sale prices on
// cards, hat pages and the bag, the announcement bar, the homepage hero, the
// popup. While it runs, the giveaway stays reachable at /giveaway but is not
// promoted anywhere. It all switches on and off by itself on the dates below.

export const BLACK_FRIDAY = {
  startsAt: '2026-11-27T05:00:00Z',
  endsAt: '2026-11-30T04:59:59Z',
  perHatOffCents: 1000,
  endsLabel: 'Sunday at midnight',
} as const;

/**
 * "Now" for sale checks. NEXT_PUBLIC_BF_NOW (an ISO date) pins the clock on a
 * PREVIEW deploy so the sale can be checked before it starts. Never set it in
 * production.
 */
export function bfNow(): number {
  const pinned = process.env.NEXT_PUBLIC_BF_NOW;
  return pinned ? Date.parse(pinned) : Date.now();
}

export function blackFridayOn(now = bfNow()): boolean {
  return now >= Date.parse(BLACK_FRIDAY.startsAt) && now <= Date.parse(BLACK_FRIDAY.endsAt);
}

/** True for a Townies hat. */
export function isHat(title: string): boolean {
  return /\bhat\b/i.test(title) && !/sack|bundle/i.test(title);
}

/** Hats left out of the sale by name (Lucas 11-26). */
const EXCLUDED = /charlestown/i;

/**
 * Is this hat in the sale? Mirrors the Shopify collection rule: a hat, not
 * Charlestown, and in stock (not pre-order). Pass whatever the caller knows:
 * `preorder` (hat page / bag line), `tags` (`preorder` tag), `stock` (on hand).
 */
export function bfEligible(p: { title: string; preorder?: boolean; tags?: string[]; stock?: number | null }): boolean {
  if (!isHat(p.title) || EXCLUDED.test(p.title)) return false;
  if (p.preorder) return false;
  if (p.tags?.includes('preorder')) return false;
  if (typeof p.stock === 'number' && p.stock <= 0) return false;
  return true;
}

/** Sale price of a hat in cents (2999 -> 1999). */
export function bfHatPriceCents(priceCents: number): number {
  return Math.max(0, priceCents - BLACK_FRIDAY.perHatOffCents);
}

export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
