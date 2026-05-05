import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN ?? '(not set)';
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '';
  const tokenPrefix = token ? token.slice(0, 8) + '...' : '(empty)';
  const url = `https://${domain}/api/2025-10/graphql.json`;
  const query = JSON.stringify({ query: '{ shop { name } }' });

  async function attempt(label: string, headers: Record<string, string>) {
    const res = await fetch(url, { method: 'POST', headers, body: query });
    const raw = await res.text();
    let body: unknown;
    try { body = JSON.parse(raw); } catch { body = raw; }
    return { status: res.status, body };
  }

  const results = {
    storefront_header: await attempt('storefront_header', {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    }),
    bearer: await attempt('bearer', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }),
    no_auth: await attempt('no_auth', {
      'Content-Type': 'application/json',
    }),
  };

  return NextResponse.json({ domain, tokenPrefix, url, results });
}
