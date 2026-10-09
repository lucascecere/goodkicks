import 'server-only';
import { db } from './db';
import { getShopStripe, royalbacksAccountEnv } from './config';

// RoyalBacks (Dylan) gets $5 a hat for the businesses that came through him.
// His Stripe Express account lives in shop_settings, connected from
// Admin › Market › Payouts, so nobody has to paste an id into Vercel.

const KEY = 'royalbacks_stripe_account';

export async function royalbacksAccountId(): Promise<string | null> {
  const env = royalbacksAccountEnv();
  if (env) return env;
  const { data } = await db().from('shop_settings').select('value').eq('key', KEY).maybeSingle();
  return data?.value ?? null;
}

export async function ensureRoyalbacksAccount(email: string | null): Promise<string> {
  const existing = await royalbacksAccountId();
  if (existing) return existing;
  const account = await getShopStripe().accounts.create(
    {
      type: 'express',
      country: 'US',
      email: email ?? undefined,
      capabilities: { transfers: { requested: true } },
      business_profile: { name: 'Royal Backs', product_description: 'Hat production partner for the Townies local market.', mcc: '5699' },
      metadata: { role: 'royalbacks' },
    },
    { idempotencyKey: 'royalbacks_express_v1' },
  );
  await db().from('shop_settings').upsert({ key: KEY, value: account.id, updated_at: new Date().toISOString() });
  return account.id;
}

export async function royalbacksStatus(): Promise<{ accountId: string | null; ready: boolean }> {
  const accountId = await royalbacksAccountId();
  if (!accountId) return { accountId: null, ready: false };
  try {
    const a = await getShopStripe().accounts.retrieve(accountId);
    return { accountId, ready: a.capabilities?.transfers === 'active' && Boolean(a.details_submitted) };
  } catch {
    return { accountId, ready: false };
  }
}

const LINK_KEY = 'royalbacks_connect_token';

/**
 * A stable link to send Dylan. Stripe's own onboarding links expire within
 * minutes, so ours mints a fresh one each time it's opened.
 */
export async function royalbacksConnectToken(): Promise<string> {
  const { data } = await db().from('shop_settings').select('value').eq('key', LINK_KEY).maybeSingle();
  if (data?.value) return data.value;
  const { randomBytes } = await import('node:crypto');
  const token = randomBytes(24).toString('base64url');
  await db().from('shop_settings').upsert({ key: LINK_KEY, value: token, updated_at: new Date().toISOString() });
  return token;
}

export async function royalbacksTokenValid(token: string): Promise<boolean> {
  if (!token || token.length < 20) return false;
  const { data } = await db().from('shop_settings').select('value').eq('key', LINK_KEY).maybeSingle();
  return data?.value === token;
}
