import 'server-only';
import { getShopStripe } from './config';
import { updateSeller } from './db';
import type { Seller } from './types';

// Payout accounts for businesses (and RoyalBacks), on Stripe Accounts v2.
//
// Townies is the merchant of record: buyers pay us, and we transfer each
// business its share (separate charges and transfers). So a business only
// needs to RECEIVE transfers: a v2 account with the `recipient`
// configuration and the `stripe_transfers` capability, an Express dashboard,
// and Stripe-hosted onboarding. For that flow Stripe requires the platform to
// own losses and fees (`application`), which in turn needs the loss-liability
// acknowledgement on the Townies Stripe Connect platform profile.
//
// The legacy v1 `type: 'express'` call is rejected on new Stripe accounts
// (2026-10-09), hence v2.

export async function createRecipientAccount({
  email,
  name,
  metadata,
  idempotencyKey,
}: {
  email: string | null;
  name: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}): Promise<string> {
  const account = await getShopStripe().v2.core.accounts.create(
    {
      contact_email: email ?? undefined,
      display_name: name,
      dashboard: 'express',
      identity: { country: 'us' },
      defaults: {
        responsibilities: { fees_collector: 'application', losses_collector: 'application' },
      },
      configuration: {
        recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
      },
      metadata,
    },
    { idempotencyKey },
  );
  return account.id;
}

/** Can this account receive transfers yet? Reads the v2 capability, not v1 flags. */
export async function canReceiveTransfers(accountId: string): Promise<boolean> {
  const account = await getShopStripe().v2.core.accounts.retrieve(accountId, { include: ['configuration.recipient'] });
  return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === 'active';
}

export async function ensureExpressAccount(seller: Seller): Promise<string> {
  if (seller.stripe_account_id) return seller.stripe_account_id;
  const id = await createRecipientAccount({
    email: seller.contact_email,
    name: seller.name,
    metadata: { seller_id: seller.id, seller_slug: seller.slug },
    idempotencyKey: `recipient_${seller.id}`,
  });
  await updateSeller(seller.id, { stripe_account_id: id });
  return id;
}

export async function onboardingLink(accountId: string, returnUrl: string, refreshUrl: string): Promise<string> {
  const link = await getShopStripe().v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: { configurations: ['recipient'], return_url: returnUrl, refresh_url: refreshUrl },
    },
  });
  return link.url;
}

/** Ask Stripe directly whether this business can receive transfers yet. */
export async function refreshPayoutStatus(seller: Seller): Promise<boolean> {
  if (!seller.stripe_account_id) return false;
  const enabled = await canReceiveTransfers(seller.stripe_account_id);
  if (enabled !== seller.payouts_enabled) await updateSeller(seller.id, { payouts_enabled: enabled });
  return enabled;
}

/** A one-time login link to their Stripe Express dashboard. */
export async function expressDashboardLink(accountId: string): Promise<string> {
  const link = await getShopStripe().accounts.createLoginLink(accountId);
  return link.url;
}
