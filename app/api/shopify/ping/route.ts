import { NextResponse } from 'next/server';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN ?? '(not set)';
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '';
  const tokenSet = !!(token && token !== 'placeholder-build-token');
  const url = `https://${domain}/api/2025-01/graphql.json`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: '{ shop { name } }' }),
    });

    const httpStatus = res.status;
    const raw = await res.text();

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = raw; }

    return NextResponse.json({ domain, tokenSet, url, httpStatus, response: parsed });
  } catch (err) {
    return NextResponse.json({ domain, tokenSet, url, error: String(err) }, { status: 500 });
  }
}
