import { NextRequest, NextResponse } from 'next/server';
import { createShopifyCart } from '@/lib/shopify/service';

type CheckoutItem = {
  variantId: string;
  quantity: number;
  customAttributes?: Array<{ key: string; value: string }>;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: CheckoutItem[] = body?.items ?? [];
  const discountCode: string | undefined = body?.discountCode;

  if (!items.length) {
    return NextResponse.json({ error: 'cart is empty' }, { status: 400 });
  }

  const lines = items.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
    ...(item.customAttributes?.length ? { attributes: item.customAttributes } : {}),
  }));

  try {
    const cart = await createShopifyCart(lines, discountCode ? [discountCode] : undefined);
    if (!cart) {
      return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
    }
    return NextResponse.json({ url: cart.checkoutUrl });
  } catch (err) {
    console.error('[checkout] Shopify error:', err);
    return NextResponse.json({ error: 'checkout failed' }, { status: 500 });
  }
}
