import { NextResponse } from 'next/server';
import { getShopStripe } from '@/lib/shop/config';
import { handleShopEvent } from '@/lib/shop/webhook';

// Stripe → the shop. Register this URL on the Townies Local Stripe account
// (and "Connected accounts" events for account.updated), with its signing
// secret in SHOP_STRIPE_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.SHOP_STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) return new NextResponse('Not configured', { status: 400 });

  const raw = await req.text();
  let event;
  try {
    event = getShopStripe().webhooks.constructEvent(raw, sig, secret);
  } catch {
    return new NextResponse('Bad signature', { status: 400 });
  }

  try {
    await handleShopEvent(event);
  } catch (err) {
    // 500 makes Stripe retry, which every handler is safe to receive.
    console.error('[shop] webhook', event.type, 'failed:', err);
    return new NextResponse('Handler failed', { status: 500 });
  }
  return NextResponse.json({ received: true });
}
