// Client-safe half of lib/shopify/stock.ts — no next/cache, no Admin token —
// so the product card (rendered inside a client shop filter) can import it.

/** Show a "only N left" nudge at or below this count. */
export const LOW_STOCK_THRESHOLD = 10;

/** Shopper-facing copy for a known count. Returns null when nothing to say. */
export function stockNote(quantity: number | null | undefined): string | null {
  if (typeof quantity !== 'number' || quantity <= 0) return null;
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return quantity === 1 ? 'In stock · last one · ships now' : `In stock · only ${quantity} left · ships now`;
  }
  return 'In stock · ships now';
}
