import type { CollectionProduct } from '@/lib/shopify/collections';
import { isPreorder } from '@/lib/townies/preorder';

/**
 * In stock → pre-order → sold out. Same test as ProductCard: availableForSale
 * alone lies here (every variant is CONTINUE), so the real count decides.
 * Shared by the shop grid and the homepage grid so they never disagree.
 */
export function stockTier(p: CollectionProduct): number {
  if (isPreorder(p.tags)) return 1;
  const available = p.variants.edges[0]?.node.availableForSale ?? false;
  return available && typeof p.stock === 'number' && p.stock > 0 ? 0 : 2;
}

/** Stable sort: in stock first, then pre-order, sold out last. For rails. */
export function sortByStock<T extends CollectionProduct>(list: T[]): T[] {
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => stockTier(a.p) - stockTier(b.p) || a.i - b.i)
    .map(({ p }) => p);
}
