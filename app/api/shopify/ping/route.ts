import { NextResponse } from 'next/server';

const VERSIONS = ['2025-10', '2025-07', '2025-04', '2025-01', '2024-10'];

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN ?? '(not set)';
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '';
  const tokenSet = !!(token && token !== 'placeholder-build-token');
  const tokenPrefix = token ? token.slice(0, 8) + '...' : '(empty)';

  const results: Record<string, unknown> = {};

  for (const version of VERSIONS) {
    const url = `https://${domain}/api/${version}/graphql.json`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({ query: '{ shop { name } }' }),
      });
      const raw = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(raw); } catch { parsed = raw; }
      results[version] = { status: res.status, body: parsed };
    } catch (err) {
      results[version] = { error: String(err) };
    }
  }

  return NextResponse.json({ domain, tokenSet, tokenPrefix, results });
}
