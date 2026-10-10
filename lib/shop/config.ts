import 'server-only';
import Stripe from 'stripe';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';

// Everything the shop needs from the environment, in one place.
//
// The shop runs on its OWN Stripe account (not Shopify, not the YWF platform),
// so its keys have their own names and can never be mixed up with anything
// else in this app.
//
//   SHOP_STRIPE_SECRET_KEY        the Townies Local Stripe account (sk_test_… while building)
//   SHOP_STRIPE_WEBHOOK_SECRET    whsec_ for /api/shop/webhook
//   SHOP_ROYALBACKS_ACCOUNT_ID    optional override; normally set by connecting Dylan in Admin › Market
//   SHIPPO_API_KEY                labels
//   SHOP_SHIP_FROM                JSON ship-from address for labels
//   SHOP_NOTIFY_EMAIL             where "print & ship" alerts go (default info@townies.shop)
//   SHOP_ROYALBACKS_EMAIL         where reorder requests go

let stripe: Stripe | null = null;

export function shopStripeConfigured(): boolean {
  return Boolean(process.env.SHOP_STRIPE_SECRET_KEY);
}

export function getShopStripe(): Stripe {
  const key = process.env.SHOP_STRIPE_SECRET_KEY;
  if (!key) throw new Error('SHOP_STRIPE_SECRET_KEY is not set.');
  stripe ??= new Stripe(key);
  return stripe;
}

/**
 * Can people buy on the market yet? Until this is true the market is a
 * showcase: shops and hats on display, "Coming soon", no prices, no bag.
 * Needs Stripe connected AND SHOP_MARKET_OPEN=true, so connecting Stripe
 * alone never opens it by surprise.
 */
export function marketOpen(): boolean {
  return shopStripeConfigured() && process.env.SHOP_MARKET_OPEN === 'true';
}

/**
 * Test shops (slug starting `test-`) are kept as status 'approved' in the
 * shared database, so the live site never shows them. Only where this flag is
 * on (the preview/test site) are they treated as open shops.
 */
export function testShopsVisible(): boolean {
  return process.env.SHOP_SHOW_TEST_SHOPS === 'true';
}

export function isTestShop(slug: string): boolean {
  return slug.startsWith('test-');
}

export function shopIsTestMode(): boolean {
  return (process.env.SHOP_STRIPE_SECRET_KEY ?? '').startsWith('sk_test_');
}

export const SHOP_FROM = TOWNIES_FROM;
export const SHOP_REPLY_TO = 'info@townies.shop';

export function notifyEmail(): string {
  return process.env.SHOP_NOTIFY_EMAIL || 'info@townies.shop';
}

export function royalbacksEmail(): string | null {
  return process.env.SHOP_ROYALBACKS_EMAIL || null;
}

/** Env override only; the normal source is shop_settings (see royalbacks.ts). */
export function royalbacksAccountEnv(): string | null {
  return process.env.SHOP_ROYALBACKS_ACCOUNT_ID || null;
}

/** Absolute site URL for links in emails and Stripe redirects. */
export function siteUrl(): string {
  // On a Vercel preview, stay on the preview: otherwise Stripe sends people
  // back to the live site after onboarding or paying.
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_TOWNIES_URL || 'https://townies.shop').replace(/\/$/, '');
}

/** Stripe and email clients need full URLs; product images are often stored as /paths. */
export function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

export { MARKET_BASE } from './paths';
