import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

// One-click unsubscribe links for campaign mail.
//
// The token is an HMAC of the email under its own label, so it can only ever
// mean "unsubscribe this address": it is useless as an admin session or a
// spin token even though it may share a key with them.

const LABEL = 'townies-unsubscribe-v1:';

function secret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_SESSION_SECRET || null;
}

export function unsubscribeToken(email: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac('sha256', key).update(LABEL + email.toLowerCase().trim()).digest('base64url').slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (!expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/** https link for the footer and the List-Unsubscribe header, or null without a key. */
export function unsubscribeUrl(siteUrl: string, email: string): string | null {
  const t = unsubscribeToken(email);
  if (!t) return null;
  return `${siteUrl}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${t}`;
}
