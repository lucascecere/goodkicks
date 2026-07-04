import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get('host') ?? '').toLowerCase();

  // 1. Admin auth (unchanged).
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = req.cookies.get('gk_admin')?.value;
    const secret = process.env.ADMIN_PASSWORD;
    if (!token || !secret || token !== secret) {
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

  // 3. goodkicks.co host → serve the /goodkicks subtree at its own root (option B).
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
