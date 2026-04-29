import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!adminToken || !domain) {
    // Not yet configured — log and succeed silently so the form doesn't break
    console.warn('[subscribe] Shopify Admin credentials not set — email not synced:', email);
    return NextResponse.json({ ok: true });
  }

  // Create or update customer with acceptsMarketing via Admin API
  const res = await fetch(`https://${domain}/admin/api/2026-04/customers.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      customer: {
        email,
        accepts_marketing: true,
        marketing_opt_in_level: 'single_opt_in',
        tags: 'newsletter,website-footer',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json();
    // 422 = customer already exists — treat as success
    if (res.status === 422) {
      return NextResponse.json({ ok: true });
    }
    console.error('[subscribe] Shopify error:', body);
    return NextResponse.json({ error: 'shopify error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
