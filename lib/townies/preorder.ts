// Preorder support. A product is a preorder when it carries the `preorder` tag
// in Shopify — paired with "continue selling when out of stock" so it stays
// buyable at 0 inventory. The ship note is one configurable estimate for the
// drop (override per drop via NEXT_PUBLIC_PREORDER_SHIP_NOTE).

export const PREORDER_TAG = 'preorder';

// Must stay in sync with the Shopify "Pre-order" shipping option (its name,
// delivery details, and transit time) — the checkout promise is the binding one.
export const PREORDER_SHIP_NOTE =
  process.env.NEXT_PUBLIC_PREORDER_SHIP_NOTE ?? 'Ships in 3–4 weeks';

export function isPreorder(tags: string[] | undefined | null): boolean {
  return Array.isArray(tags) && tags.some((t) => t.toLowerCase() === PREORDER_TAG);
}
