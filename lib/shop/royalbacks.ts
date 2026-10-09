import 'server-only';
import { db } from './db';
import { royalbacksAccountEnv } from './config';
import { canReceiveTransfers, createRecipientAccount } from './connect';

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
  const id = await createRecipientAccount({
    email,
    name: 'Royal Backs',
    metadata: { role: 'royalbacks' },
    idempotencyKey: 'royalbacks_recipient_v2',
  });
  await db().from('shop_settings').upsert({ key: KEY, value: id, updated_at: new Date().toISOString() });
  return id;
}

export async function royalbacksStatus(): Promise<{ accountId: string | null; ready: boolean }> {
  const accountId = await royalbacksAccountId();
  if (!accountId) return { accountId: null, ready: false };
  try {
    return { accountId, ready: await canReceiveTransfers(accountId) };
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
