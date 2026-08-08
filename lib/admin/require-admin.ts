import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './session';

/**
 * Is this request an authenticated admin?
 *
 * middleware.ts deliberately skips /api (see its matcher), so every admin route
 * has to check for itself. This is that check, in one place — it used to be
 * copy-pasted into fifteen files, each comparing the cookie to the raw
 * password.
 */
export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

export function unauthorized(): Response {
  return new Response('Unauthorized', { status: 401 });
}
