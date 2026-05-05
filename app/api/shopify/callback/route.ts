import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');
  const hmac = searchParams.get('hmac');

  if (!code || !shop || !hmac) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  // Verify HMAC so only Shopify can hit this
  const params = Object.fromEntries(searchParams.entries());
  delete params.hmac;
  const message = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&');
  const digest = crypto
    .createHmac('sha256', process.env.SHOPIFY_CLIENT_SECRET ?? '')
    .update(message)
    .digest('hex');

  if (digest !== hmac) {
    return NextResponse.json({ error: 'invalid hmac' }, { status: 401 });
  }

  // Exchange the code for a permanent access token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  const { access_token } = await tokenRes.json() as { access_token: string };

  console.log('[shopify/callback] access_token:', access_token);

  // Return the token — copy it to Vercel as SHOPIFY_ADMIN_API_TOKEN
  return NextResponse.json({
    message: 'Copy this token into Vercel as SHOPIFY_ADMIN_API_TOKEN then redeploy.',
    token: access_token,
  });
}
