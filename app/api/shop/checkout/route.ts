import { NextResponse } from 'next/server';
import { z } from 'zod';
import { startCheckout, CheckoutError } from '@/lib/shop/checkout';
import { shopStripeConfigured } from '@/lib/shop/config';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

const Body = z.object({
  delivery: z.enum(['ship', 'pickup']),
  lines: z
    .array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(20) }))
    .min(1)
    .max(30),
});

export async function POST(req: Request) {
  if (!shopStripeConfigured()) {
    return NextResponse.json({ error: 'Checkout is not open yet.' }, { status: 503 });
  }
  if (!rateLimit(`shop-checkout:${callerIp(req.headers)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many tries. Give it a minute.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Your bag looks off. Refresh and try again.' }, { status: 400 });

  try {
    const { url } = await startCheckout(parsed.data);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof CheckoutError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('[shop] checkout failed:', err);
    return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 });
  }
}
