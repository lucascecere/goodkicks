import { NextRequest, NextResponse } from 'next/server';
import { storefrontClient } from '@/lib/shopify/client';
import { CUSTOMER_CREATE_MUTATION } from '@/lib/shopify/mutations';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { requestBrand } from '@/lib/brand/site-brand';

export async function POST(req: NextRequest) {
  const { email, brand } = await req.json();

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  // The form says which brand rendered it, because Host cannot: the Good Kicks
  // footer also lives at townies.shop/goodkicks, where this POST arrives with
  // Host: townies.shop.
  await upsertContact({ email, source: 'newsletter', brand: requestBrand(req, brand) });

  try {
    const { data } = await storefrontClient.request(CUSTOMER_CREATE_MUTATION, {
      variables: {
        input: {
          email,
          acceptsMarketing: true,
          password: crypto.randomUUID(),
        },
      },
    });

    const errors = data?.customerCreate?.customerUserErrors ?? [];
    const alreadyExists = errors.some((e: { code: string }) =>
      ['TAKEN', 'CUSTOMER_ALREADY_USED_ONCE'].includes(e.code)
    );

    if (errors.length > 0 && !alreadyExists) {
      console.error('[subscribe] Shopify errors:', errors);
      return NextResponse.json({ error: 'subscription failed' }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[subscribe] Storefront not configured:', err);
    return NextResponse.json({ ok: true });
  }
}
