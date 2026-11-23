// Which bag lines are hats, by Shopify's own productType, for the two-town deal
// (lib/townies/two-town-deal.ts). The automatic discount counts productType
// "Hats", so the bag asks the same question instead of guessing from titles:
// the Hat & Sack bundle is productType "Bundle" and foot bags aren't hats.

import { unstable_cache } from 'next/cache';
import { TWO_TOWN_DEAL } from '@/lib/townies/two-town-deal';

const QUERY = `
  query VariantProductTypes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        product { productType }
      }
    }
  }
`;

type Node = { id?: string; product?: { productType?: string | null } | null } | null;

async function fetchHatVariantIds(ids: string[]): Promise<string[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!ids.length) return [];
  if (!domain || !token) throw new Error('Shopify storefront not configured');
  const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: QUERY, variables: { ids } }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Shopify storefront ${res.status}`);
  const json = (await res.json()) as { data?: { nodes?: Node[] }; errors?: unknown };
  // Throw rather than return [] so unstable_cache doesn't store a failure as
  // "no hats" (which would hide a deal the shopper is getting).
  if (!json.data?.nodes) throw new Error(`Shopify storefront: ${JSON.stringify(json.errors ?? 'no nodes')}`);
  return json.data.nodes
    .filter((n) => n?.id && n.product?.productType === TWO_TOWN_DEAL.hatProductType)
    .map((n) => n!.id!);
}

/** The subset of `ids` (variant GIDs, sorted) whose product is a hat. Cached 10 minutes. Throws when Shopify can't be read. */
export const getHatVariantIds = unstable_cache(fetchHatVariantIds, ['shopify-hat-variant-ids'], {
  revalidate: 600,
});
