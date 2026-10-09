import { NextResponse } from 'next/server';
import { onboardingLink } from '@/lib/shop/connect';
import { royalbacksEmail, shopStripeConfigured, siteUrl } from '@/lib/shop/config';
import { ensureRoyalbacksAccount, royalbacksTokenValid } from '@/lib/shop/royalbacks';

// Dylan's payout setup link (see Admin › Market › Payouts).
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await royalbacksTokenValid(token))) return new NextResponse('This link has expired.', { status: 404 });
  if (!shopStripeConfigured()) return new NextResponse('Payouts are not open yet.', { status: 503 });
  try {
    const account = await ensureRoyalbacksAccount(royalbacksEmail());
    const url = await onboardingLink(account, `${siteUrl()}/local?payouts=connected`, `${siteUrl()}/api/shop/royalbacks/${token}`);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('[shop] royalbacks connect failed:', err);
    return new NextResponse('Payout setup failed on our side. Nothing was saved. Try again in a few minutes.', { status: 502 });
  }
}
