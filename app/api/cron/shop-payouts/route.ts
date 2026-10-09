import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { shopStripeConfigured } from '@/lib/shop/config';
import { releaseDuePayouts } from '@/lib/shop/payouts';

// Daily: pay out every business whose 14-day hold has ended.
export async function GET(req: Request) {
  const want = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  const got = req.headers.get('authorization') ?? '';
  if (!process.env.CRON_SECRET || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (!shopStripeConfigured()) return NextResponse.json({ skipped: 'SHOP_STRIPE_SECRET_KEY not set' });
  const results = await releaseDuePayouts();
  return NextResponse.json({ sent: results.filter((r) => !r.error).length, failed: results.filter((r) => r.error) });
}
