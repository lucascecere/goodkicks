import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin/session';

const PUBLIC_FILE = /\.[^/]+$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get('host') ?? '').toLowerCase();

  // 1. Admin auth. The cookie is a signed, self-expiring session token — it no
  //    longer carries the password itself. Verified with Web Crypto because
  //    this file runs on the edge runtime, where node:crypto is unavailable.
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (!ok) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 2. Good Kicks is a live sister line now, not clearance — retire /clearance.
  if (pathname === '/clearance' || pathname.startsWith('/clearance/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/goodkicks';
    url.search = '';
    return NextResponse.redirect(url, 308);
  }

  // 3. Bulk orders live at /wholesale — the URL keeps its inbound links and
  //    search history while the page itself now leads with bulk. These are the
  //    addresses people actually type or guess when they want 40 hats.
  if (
    pathname === '/bulk-orders' ||
    pathname === '/bulk' ||
    pathname === '/team-orders' ||
    pathname === '/custom'
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/wholesale';
    return NextResponse.redirect(url, 308);
  }

  // 4. goodkicks.co host → serve the /goodkicks subtree at its own root (option B).
  //    Gated behind ENABLE_GK_HOST_REWRITE because goodkicks.co is still the live
  //    prod domain on `main`; the rewrite only flips on at cutover.
  if (
    process.env.ENABLE_GK_HOST_REWRITE === 'true' &&
    (host === 'goodkicks.co' || host === 'www.goodkicks.co') &&
    !pathname.startsWith('/goodkicks') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/admin') &&
    !PUBLIC_FILE.test(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/goodkicks${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on page routes; skip _next internals, /api, and static files.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
