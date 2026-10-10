// Real on-hand stock per variant, read through the Admin API.
//
// Why not Storefront `quantityAvailable`: it needs the
// `unauthenticated_read_product_inventory` scope on the storefront token, and a
// missing scope fails the WHOLE product query (the PDP would 404). The Admin
// token already has `read_products`, which exposes `inventoryQuantity`, so this
// is a separate, best-effort read that can never take a page down.
//
// A hat only reports a number when it is tracked AND set to stop selling at
// zero (`DENY`). Pre-order hats run `CONTINUE` with a negative count, and that
// number is meaningless to a shopper, so they report `null` (unknown).

import { unstable_cache } from 'next/cache';
import { isShopifyAdminConfigured, shopifyAdminGraphQL } from './admin-graphql';
import { ownStock, storefrontOwn } from '@/lib/shop/catalog';

export type VariantStock = {
  /** Units on hand, or null when the count is not meaningful for shoppers. */
  quantity: number | null;
};

export { LOW_STOCK_THRESHOLD, stockNote } from './stock-copy';

type VariantNode = {
  id: string;
  inventoryQuantity: number | null;
  inventoryPolicy: 'DENY' | 'CONTINUE';
  inventoryItem: { tracked: boolean } | null;
} | null;

const QUERY = `
  query VariantStock($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        inventoryQuantity
        inventoryPolicy
        inventoryItem { tracked }
      }
    }
  }
`;

async function fetchStock(ids: string[]): Promise<Record<string, VariantStock>> {
  // Storefront switch: counts come from our own shop_products.
  if (storefrontOwn()) return ownStock(ids);
  const out: Record<string, VariantStock> = {};
  if (!ids.length || !isShopifyAdminConfigured()) return out;
  // One retry, then THROW: unstable_cache does not store a thrown result, so a
  // throttled or timed-out read is retried on the next request instead of an
  // empty map being cached for a minute (which read as "every hat sold out").
  let data: { nodes: VariantNode[] };
  try {
    data = await shopifyAdminGraphQL<{ nodes: VariantNode[] }>(QUERY, { ids });
  } catch (err) {
    console.error('[stock] admin read failed, retrying:', err);
    data = await shopifyAdminGraphQL<{ nodes: VariantNode[] }>(QUERY, { ids });
  }
  for (const n of data.nodes) {
    if (!n) continue;
    const meaningful =
      n.inventoryItem?.tracked === true &&
      n.inventoryPolicy === 'DENY' &&
      typeof n.inventoryQuantity === 'number';
    out[n.id] = { quantity: meaningful ? Math.max(0, n.inventoryQuantity as number) : null };
  }
  return out;
}

/**
 * Stock for a set of variant GIDs. Cached for a minute, same window as the
 * collection reads, so a sale shows up on the site within ~60s. Throws when
 * Shopify can't be read, for callers that must tell "sold out" from "unknown".
 */
export const getVariantStockStrict = unstable_cache(fetchStock, ['shopify-variant-stock'], {
  revalidate: 60,
  tags: ['shopify-stock'],
});

/** Best-effort version: an unreadable count degrades to "unknown" ({}). */
export async function getVariantStock(ids: string[]): Promise<Record<string, VariantStock>> {
  try {
    return await getVariantStockStrict(ids);
  } catch (err) {
    console.error('[stock] admin read failed:', err);
    return {};
  }
}
