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
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_TOWNIES_URL || 'https://townies.shop').replace(/\/$/, '');
}

export { MARKET_BASE } from './paths';
