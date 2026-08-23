import 'server-only';

// The spin result, signed.
//
// The wheel has to show the prize BEFORE it asks for an email — that ordering
// is the entire psychology of the thing. So the result exists in the browser
// for a minute or two before it's claimed, which means the claim endpoint can't
// trust the browser to tell it what was won. It gets this token instead: the
// wedge index the server drew, HMAC-signed, short-lived, single-use.
//
// Same construction and the same reasoning as lib/admin/session.ts — Web Crypto
// rather than node:crypto, so nothing here is tied to the node runtime.

import { SPIN_TOKEN_TTL_SECONDS } from './spin-prizes';

const encoder = new TextEncoder();

/**
 * Signing key. A dedicated SPIN_SECRET is preferred, but it falls back to the
 * admin secrets so the feature works the moment it deploys rather than silently
 * refusing every spin because one more env var wasn't set.
 *
 * If NONE of these is set the token can't be signed and /api/spin returns 503.
 * That is deliberate: an unsigned token is a forgeable token, and a forgeable
 * token is a 20% discount for anybody who reads the network tab.
 */
function secret(): string | null {
  return (
    process.env.SPIN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    null
  );
}

export function isSpinSigningConfigured(): boolean {
  return secret() !== null;
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
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
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

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64urlFromBytes(bytes);
}

export type SpinTokenPayload = {
  /** Wedge index the server drew. */
  w: number;
  /** Unix seconds. */
  exp: number;
  /** Random per-spin id. Stored on the claim row under a UNIQUE index, which is
   *  what actually enforces "one claim per spin" — the signature alone can't,
   *  since a valid token stays valid until it expires. */
  n: string;
};

export async function createSpinToken(wedgeIndex: number): Promise<string> {
  const key = secret();
  if (!key) throw new Error('Cannot sign a spin: no SPIN_SECRET / ADMIN_SESSION_SECRET / ADMIN_PASSWORD');

  const payload: SpinTokenPayload = {
    w: wedgeIndex,
    exp: Math.floor(Date.now() / 1000) + SPIN_TOKEN_TTL_SECONDS,
    n: randomNonce(),
  };
  const encoded = base64urlEncode(JSON.stringify(payload));
  return `${encoded}.${await sign(encoded, key)}`;
}

/** Fails closed on every ambiguity: no secret, malformed, bad signature, expired. */
export async function verifySpinToken(token: unknown): Promise<SpinTokenPayload | null> {
  if (typeof token !== 'string' || !token) return null;
  const key = secret();
  if (!key) return null;

  const dot = token.lastIndexOf('.');
  if (dot <= 0 || dot === token.length - 1) return null;

  const encoded = token.slice(0, dot);
  const provided = token.slice(dot + 1);

  let expected: string;
  try {
    expected = await sign(encoded, key);
  } catch {
    return null;
  }
  if (!safeEqual(expected, provided)) return null;

  try {
    const data = JSON.parse(base64urlDecode(encoded)) as Partial<SpinTokenPayload>;
    if (typeof data.w !== 'number' || typeof data.exp !== 'number' || typeof data.n !== 'string') {
      return null;
    }
    if (Math.floor(Date.now() / 1000) >= data.exp) return null;
    return { w: data.w, exp: data.exp, n: data.n };
  } catch {
    return null;
  }
}
