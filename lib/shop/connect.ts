import 'server-only';
import { getShopStripe } from './config';
import { updateSeller } from './db';
import type { Seller } from './types';

// Payout setup for a business: a Stripe Express account under our Townies
// Local platform, onboarded through Stripe's hosted pages. We only need the
// `transfers` capability: buyers pay us, we transfer each business its share.

export async function ensureExpressAccount(seller: Seller): Promise<string> {
  if (seller.stripe_account_id) return seller.stripe_account_id;
  const account = await getShopStripe().accounts.create(
    {
      type: 'express',
      country: 'US',
      email: seller.contact_email ?? undefined,
      capabilities: { transfers: { requested: true } },
      business_profile: {
        name: seller.name,
        url: seller.website ?? undefined,
        product_description: 'Custom embroidered hats sold through the Townies local market.',
        mcc: '5699',
      },
      metadata: { seller_id: seller.id, seller_slug: seller.slug },
    },
    { idempotencyKey: `express_${seller.id}` },
  );
  await updateSeller(seller.id, { stripe_account_id: account.id });
  return account.id;
}

export async function onboardingLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const link = await getShopStripe().accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
  return link.url;
}

/** Ask Stripe directly whether this account can receive transfers yet. */
export async function refreshPayoutStatus(seller: Seller): Promise<boolean> {
  if (!seller.stripe_account_id) return false;
  const account = await getShopStripe().accounts.retrieve(seller.stripe_account_id);
  const enabled = account.capabilities?.transfers === 'active' && Boolean(account.details_submitted);
  if (enabled !== seller.payouts_enabled) await updateSeller(seller.id, { payouts_enabled: enabled });
  return enabled;
}

/** A one-time login link to their Stripe Express dashboard. */
export async function expressDashboardLink(accountId: string): Promise<string> {
  const link = await getShopStripe().accounts.createLoginLink(accountId);
  return link.url;
}
