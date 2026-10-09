import { NextResponse } from 'next/server';
import { getSellerByToken } from '@/lib/shop/db';
import { ensureExpressAccount, onboardingLink } from '@/lib/shop/connect';
import { MARKET_BASE, shopStripeConfigured, siteUrl } from '@/lib/shop/config';

// The "Connect payouts" button on a business's join link: make (or reuse)
// their Stripe payout account and send them into Stripe's onboarding.
// Errors come back as a readable page, not a blank 500 (2026-10-09).
function problem(message: string, status: number, back?: string) {
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payouts</title>
<body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#0D1B2A">
<h1 style="font-size:22px">We couldn't open payout setup</h1>
<p style="line-height:1.6;color:#5C6168">${message}</p>
${back ? `<p><a href="${back}" style="color:#0D1B2A">Back to your shop setup</a></p>` : ''}</body>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const seller = await getSellerByToken(token);
  if (!seller) return problem('This link has expired. Ask us for a new one.', 404);
  if (!shopStripeConfigured()) return problem('Payouts are not open yet. We will email you when they are.', 503);

  const join = `${siteUrl()}${MARKET_BASE}/join/${token}`;
  if (!seller.contact_email) {
    return problem('Add your email in step 1 of your shop setup and save it first. Stripe needs it to set up your payouts.', 400, join);
  }
  try {
    const account = await ensureExpressAccount(seller);
    const url = await onboardingLink(account, `${join}?connected=1`, `${siteUrl()}/api/shop/connect/${token}`);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error('[shop] connect payouts failed:', err);
    return problem(
      'Something went wrong on our side while setting up payouts. Nothing was charged and nothing was saved. Try again in a few minutes, or reply to your invite email and we will sort it out.',
      502,
      join,
    );
  }
}
