// Black Friday weekend 2026 (Lucas 11-26): $10 off every hat, Fri Nov 27 12:00am
// to Sun Nov 29 11:59pm ET. Shipping works as normal (free over $75).
//
// The discount itself is a Shopify AUTOMATIC discount, "Black Friday: $10 off
// every hat" (gid://shopify/DiscountAutomaticNode/1242225016987): $10 off each
// item in the `all-hats` collection, scheduled for exactly this window. It
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

/** True for a Townies hat (the sale's own rule is the all-hats collection). */
export function isHat(title: string): boolean {
  return /\bhat\b/i.test(title) && !/sack|bundle/i.test(title);
}

/** Sale price of a hat in cents (2999 -> 1999). */
export function bfHatPriceCents(priceCents: number): number {
  return Math.max(0, priceCents - BLACK_FRIDAY.perHatOffCents);
}

export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
