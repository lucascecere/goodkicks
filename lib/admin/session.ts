// Admin session tokens.
//
// Replaces the previous scheme, where the login cookie's value WAS the admin
// password in plaintext. Anyone who obtained that cookie — a shared screen, a
// browser extension, a stray log — held the credential itself, not a session.
// Rotating it meant changing the password.
//
// Now the cookie is `<payload>.<hmac>`: a signed, self-expiring token that
// proves "this browser logged in successfully" and nothing more.
//
// WEB CRYPTO, NOT node:crypto — deliberately. middleware.ts runs on the edge
// runtime, where node:crypto does not exist. Web Crypto is available in both
// edge and node, so one implementation covers the middleware gate and every
// route handler. Same reason this file avoids Buffer and next/headers.

export const SESSION_COOKIE = 'gk_admin';

/** One year. See the note in app/api/admin/auth/route.ts on why it's long. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const encoder = new TextEncoder();

/**
 * Signing key. Prefers a dedicated secret so that changing the admin password
 * doesn't have to invalidate sessions, but falls back to ADMIN_PASSWORD so the
 * app keeps working before ADMIN_SESSION_SECRET is set anywhere.
 */
function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function base64urlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncode(text: string): string {
  return base64urlFromBytes(encoder.encode(text));
}

function base64urlDecode(text: string): string {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  return base64urlFromBytes(new Uint8Array(signature));
}

/** Constant-time compare, so a wrong signature leaks nothing through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const key = secret();
  if (!key) throw new Error('Cannot create a session: no ADMIN_SESSION_SECRET or ADMIN_PASSWORD');
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(JSON.stringify({ iat: now, exp: now + SESSION_MAX_AGE_SECONDS }));
  return `${payload}.${await sign(payload, key)}`;
}

/**
 * Verify a cookie value.
 *
 * Fails closed on every ambiguity — missing secret, malformed token, bad
 * signature, expired, unparseable payload. An old-style cookie (the raw
 * password) has no `.` and is rejected here, which is why the change logs
 * everyone out once.
 */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const key = secret();
  if (!key) return false;

  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;

  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);

  let expected: string;
  try {
    expected = await sign(payload, key);
  } catch {
    return false;
  }
  if (!safeEqual(expected, provided)) return false;

  // Signature is valid, so the payload is ours and can be trusted — but it can
  // still be past its expiry.
  try {
    const data = JSON.parse(base64urlDecode(payload)) as { exp?: unknown };
    if (typeof data.exp !== 'number') return false;
    return Math.floor(Date.now() / 1000) < data.exp;
  } catch {
    return false;
  }
}
