import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { getVariantById } from '@/lib/products/catalog';

type CheckoutItem = { variantId: string; quantity: number };

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: CheckoutItem[] = body?.items ?? [];

  if (!items.length) {
    return NextResponse.json({ error: 'cart is empty' }, { status: 400 });
  }

  const lineItems = [];
  for (const item of items) {
    if (!item.variantId || item.quantity < 1) {
      return NextResponse.json({ error: 'invalid item' }, { status: 400 });
    }
    const result = getVariantById(item.variantId);
    if (!result) {
      return NextResponse.json({ error: `unknown variant: ${item.variantId}` }, { status: 400 });
    }
    const { product, variant } = result;
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: variant.priceInCents,
        product_data: { name: `${product.title} — ${variant.name}` },
      },
      quantity: item.quantity,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goodkicks.co';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['US'] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
      metadata: {
        cart: JSON.stringify(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Stripe error:', err);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}
