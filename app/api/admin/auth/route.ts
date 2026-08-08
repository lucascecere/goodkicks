import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '@/lib/admin/session';

/** Registrable domains this app serves. Longest-suffix match wins. */
const SITE_DOMAINS = ['townies.shop', 'goodkicks.co'];

/**
 * Which domain the session cookie should be scoped to.
 *
 * Without this the cookie is HOST-ONLY: logging in at townies.shop produced a
 * session that www.townies.shop did not recognise, so whichever host the
 * browser happened to autocomplete decided whether you were logged in. It read
 * as "it logs me out every time I close the tab".
 *
 * Returns a leading-dot domain so apex and www share one session. Falls back to
 * host-only (undefined) for localhost and for *.vercel.app preview URLs, where
 * a shared cookie would be both wrong and, on vercel.app, refused.
 */
function cookieDomain(host: string | null): string | undefined {
  if (!host) return undefined;
  const hostname = host.split(':')[0].toLowerCase();
  const base = SITE_DOMAINS.find((d) => hostname === d || hostname.endsWith(`.${d}`));
  return base ? `.${base}` : undefined;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // Matches the token's own expiry, so the cookie and the signature
    // can never disagree about when the session ends.
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    domain: cookieDomain(req.headers.get('host')),
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  // Must clear with the SAME domain it was set with — a host-only delete does
  // not remove a domain-scoped cookie, and logout would silently do nothing.
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
    domain: cookieDomain(req.headers.get('host')),
  });
  return res;
}
