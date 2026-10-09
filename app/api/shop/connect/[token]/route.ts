import { NextResponse } from 'next/server';
import { getSellerByToken } from '@/lib/shop/db';
import { ensureExpressAccount, onboardingLink } from '@/lib/shop/connect';
import { MARKET_BASE, shopStripeConfigured, siteUrl } from '@/lib/shop/config';

// The "Connect payouts" button on a business's join link: make (or reuse)
// their Express account and send them into Stripe's onboarding.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const seller = await getSellerByToken(token);
  if (!seller) return new NextResponse('This link has expired. Ask us for a new one.', { status: 404 });
  if (!shopStripeConfigured()) return new NextResponse('Payouts are not open yet.', { status: 503 });

  const join = `${siteUrl()}${MARKET_BASE}/join/${token}`;
  const account = await ensureExpressAccount(seller);
  const url = await onboardingLink(account, `${join}?connected=1`, `${siteUrl()}/api/shop/connect/${token}`);
  return NextResponse.redirect(url, 303);
}
