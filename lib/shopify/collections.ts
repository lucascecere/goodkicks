// Collection-scoped Storefront reads for Townies.
//
// ADDITIVE ONLY — lib/shopify/service.ts (cart, single product, all products)
// is left untouched. Townies filters the shop to the `townies` collection and
// the clearance section to the `good-kicks` collection. Both collection handles
// are env-driven so they can be renamed at cutover without code changes, and
// every read degrades to [] so the build/runtime never depends on a collection
// existing yet.

export type CollectionProduct = {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  featuredImage: { url: string; altText: string | null } | null;
  variants: {
    edges: Array<{
      node: {
        id: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
      };
    }>;
  };
};

export const TOWNIES_COLLECTION =
  process.env.SHOPIFY_TOWNIES_COLLECTION ?? 'townies';
export const GOODKICKS_COLLECTION =
  process.env.SHOPIFY_GOODKICKS_COLLECTION ?? 'good-kicks';

const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            tags
            featuredImage { url altText }
            variants(first: 1) {
              edges {
                node {
                  id
                  availableForSale
                  price { amount currencyCode }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getProductsByCollection(
  handle: string,
  first = 50,
): Promise<CollectionProduct[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return [];

  try {
    const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query: COLLECTION_PRODUCTS_QUERY,
        variables: { handle, first },
      }),
      next: { revalidate: 3600 },
    });
    const json = await res.json();
    if (json?.errors) {
      console.error('[collections]', JSON.stringify(json.errors));
      return [];
    }
    const edges = json?.data?.collection?.products?.edges;
    if (!Array.isArray(edges)) return [];
    return edges.map((e: { node: CollectionProduct }) => e.node);
  } catch (err) {
    console.error('[collections] threw:', err);
    return [];
  }
}

export const getTownieProducts = () => getProductsByCollection(TOWNIES_COLLECTION);

// Good Kicks is now a live sister line (the `good-kicks` collection), not a
// clearance archive. `getClearanceProducts` is retained as an alias so any
// legacy caller keeps building until it's fully retired.
export const getGoodKicksProducts = () =>
  getProductsByCollection(GOODKICKS_COLLECTION);
export const getClearanceProducts = getGoodKicksProducts;
