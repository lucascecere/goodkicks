// TEMPORARY diagnostic — what the Storefront API can actually see. Remove after use.
export const dynamic = 'force-dynamic';

const QUERY = `{
  collections(first: 100) {
    edges { node { handle title products(first: 100) { edges { node { handle title tags } } } } }
  }
  products(first: 100) {
    edges { node { handle title tags } }
  }
}`;

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return Response.json({ error: 'missing env' }, { status: 500 });
  const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: QUERY }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (json?.errors) return Response.json({ errors: json.errors }, { status: 502 });
  type P = { handle: string; title: string; tags: string[] };
  const collections = (json?.data?.collections?.edges ?? []).map(
    (e: { node: { handle: string; title: string; products: { edges: { node: P }[] } } }) => ({
      handle: e.node.handle,
      title: e.node.title,
      products: e.node.products.edges.map((p) => ({ handle: p.node.handle, tags: p.node.tags })),
    }),
  );
  const allProducts = (json?.data?.products?.edges ?? []).map((e: { node: P }) => ({
    handle: e.node.handle,
    title: e.node.title,
    tags: e.node.tags,
  }));
  return Response.json({
    towniesCollectionInUse: process.env.SHOPIFY_TOWNIES_COLLECTION || 'south-shore (default)',
    collections,
    allVisibleProducts: allProducts,
  });
}
