// Preorder support. A product is a preorder when it carries the `preorder` tag
// in Shopify — paired with "continue selling when out of stock" so it stays
// buyable at 0 inventory. The ship note is one configurable estimate for the
// drop (override per drop via NEXT_PUBLIC_PREORDER_SHIP_NOTE).

export const PREORDER_TAG = 'preorder';

// The default when a hat has no `ships:N` tag. Must stay inside the Shopify
// "Pre-order" shipping option's promise (2 to 4 weeks), which is the binding one.
export const PREORDER_SHIP_NOTE =
  process.env.NEXT_PUBLIC_PREORDER_SHIP_NOTE ?? 'Ships in 3–4 weeks';

/**
 * Per-hat pre-order time, from a `ships:N` tag (N = weeks, the slow end).
 * Blanks decide it: a hat whose blanks are on the shelf is about 2 weeks, one
 * waiting on blanks is longer. Edited in Shopify, no deploy.
 */
export function preorderWeeks(tags: string[] | undefined | null): number | null {
  for (const t of tags ?? []) {
    const m = /^ships:(\d{1,2})$/i.exec(t.trim());
    if (m) return Number(m[1]);
  }
  return null;
}

export function preorderShipNote(tags: string[] | undefined | null): string {
  const w = preorderWeeks(tags);
  if (!w) return PREORDER_SHIP_NOTE;
  return w <= 2 ? 'Ships in about 2 weeks' : `Ships in ${w - 1}–${w} weeks`;
}

/**
 * Last day to order and still have it for Christmas, or null once that has
 * passed (or outside the season). In-stock hats leave in 1 to 3 business days;
 * pre-orders take their weeks. Both get a week for the mail.
 */
export function christmasOrderBy(preorder: boolean, tags: string[] | undefined | null, now = new Date()): Date | null {
  const year = now.getFullYear();
  const christmas = new Date(Date.UTC(year, 11, 25, 12));
  const days = preorder ? (preorderWeeks(tags) ?? 4) * 7 + 7 : 9;
  const by = new Date(christmas.getTime() - days * 86_400_000);
  const seasonStart = new Date(Date.UTC(year, 9, 25));
  return now >= seasonStart && now <= by ? by : null;
}

export function isPreorder(tags: string[] | undefined | null): boolean {
  return Array.isArray(tags) && tags.some((t) => t.toLowerCase() === PREORDER_TAG);
}
