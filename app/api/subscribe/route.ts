import { NextRequest, NextResponse } from 'next/server';
import { storefrontClient } from '@/lib/shopify/client';
import { CUSTOMER_CREATE_MUTATION } from '@/lib/shopify/mutations';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  try {
    const { data } = await storefrontClient.request(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          acceptsMarketing: true,
          // Generates a random password — customer can reset via Shopify email
          password: crypto.randomUUID(),
        },
      },
    });

    const errors = data?.customerCreate?.customerUserErrors ?? [];
    // Code CUSTOMER_ALREADY_USED_ONCE or TAKEN = already exists, treat as success
    const alreadyExists = errors.some((e: { code: string }) =>
      ['TAKEN', 'CUSTOMER_ALREADY_USED_ONCE'].includes(e.code)
    );

    if (errors.length > 0 && !alreadyExists) {
      console.error('[subscribe] Shopify errors:', errors);
      return NextResponse.json({ error: 'subscription failed' }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Storefront not yet configured — fail silently in dev
    console.warn('[subscribe] Storefront not configured:', err);
    return NextResponse.json({ ok: true });
  }
}
