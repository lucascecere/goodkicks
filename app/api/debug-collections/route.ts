// TEMPORARY diagnostic — lists Shopify collections + product counts as seen by
// the Storefront API. Remove after use.
export const dynamic = 'force-dynamic';

const QUERY = `{
  collections(first: 100) {
    edges { node { handle title products(first: 100) { edges { node { handle } } } } }
  }
}`;

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) {
    return Response.json({ error: 'missing shopify env', domain: !!domain, token: !!token }, { status: 500 });
  }
  const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query: QUERY }),
    cache: 'no-store',
  });
  const json = await res.json();
  if (json?.errors) return Response.json({ errors: json.errors }, { status: 502 });
  const collections = (json?.data?.collections?.edges ?? []).map(
    (e: { node: { handle: string; title: string; products: { edges: { node: { handle: string } }[] } } }) => ({
      handle: e.node.handle,
      title: e.node.title,
      productCount: e.node.products.edges.length,
      sample: e.node.products.edges.slice(0, 6).map((p) => p.node.handle),
    }),
  );
  return Response.json({ activeTowniesEnv: process.env.SHOPIFY_TOWNIES_COLLECTION ?? '(default townies)', collections });
}
