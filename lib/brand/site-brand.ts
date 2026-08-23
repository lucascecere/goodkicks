// Which brand is this request for?
//
// Townies and Good Kicks share one app, one Shopify store and one Supabase.
// Everything that captures a person — newsletter, contact form, rep
// application, order webhook — has to record which brand they came in through,
// and until this file existed only two of the nine capture paths managed it.
//
// The hard case, and the reason `Host` alone is not the answer: Good Kicks is
// served BOTH at goodkicks.co AND at townies.shop/goodkicks, and it stays
// reachable at both after the host rewrite flips on. A visitor on
// townies.shop/goodkicks who submits the Good Kicks newsletter form sends
// `Host: townies.shop` — the host says Townies, the person is looking at Good
// Kicks. Middleware can't rescue this either: it sees the API path
// (/api/subscribe), not the page the form was rendered on, and its matcher
// excludes /api anyway.
//
// So the client — the only party that knows which chrome it rendered — states
// the brand, and the server validates it. Host is the fallback for callers that
// can't speak (webhooks, curl), and Townies is the fallback after that, because
// Townies is the store now.
//
// No 'use client'/'server-only' directive on purpose: middleware (edge), route
// handlers (node) and browser components all import this.

import type { RealBrand } from '@/lib/admin/brand';

export type { RealBrand };

const GOODKICKS_HOSTS = new Set(['goodkicks.co', 'www.goodkicks.co']);

/** The brand a request defaults to when nothing else identifies it. */
export const DEFAULT_BRAND: RealBrand = 'townies';

/**
 * Narrow untrusted input (a request body field, a form value) to a real brand.
 * Returns null rather than guessing, so callers decide their own fallback.
 */
export function parseBrand(value: unknown): RealBrand | null {
  return value === 'townies' || value === 'goodkicks' ? value : null;
}

/** Host header → brand. Anything that isn't a Good Kicks host is Townies. */
export function brandFromHost(host: string | null | undefined): RealBrand {
  if (!host) return DEFAULT_BRAND;
  const hostname = host.split(':')[0].toLowerCase();
  return GOODKICKS_HOSTS.has(hostname) ? 'goodkicks' : DEFAULT_BRAND;
}

/**
 * The brand of a PAGE, from the two ways Good Kicks is reachable: its own host,
 * or the /goodkicks subtree on the Townies domain. Both stay true after
 * ENABLE_GK_HOST_REWRITE flips on — the rewrite makes goodkicks.co/ render
 * /goodkicks, so the host check covers the case where the client's pathname
 * still reads "/".
 */
export function siteBrand(
  host: string | null | undefined,
  pathname: string,
): RealBrand {
  if (brandFromHost(host) === 'goodkicks') return 'goodkicks';
  if (pathname === '/goodkicks' || pathname.startsWith('/goodkicks/')) {
    return 'goodkicks';
  }
  return DEFAULT_BRAND;
}

/**
 * The brand of an API REQUEST.
 *
 * `supplied` is what the client said — pass the brand field straight off the
 * parsed body. It wins when valid because /api/* cannot see which page the
 * request came from, and Host reads "townies.shop" for townies.shop/goodkicks.
 *
 * This is a provenance tag, not an authorization boundary: the worst a forged
 * value does is mis-tag one contact row, which the admin can now correct.
 */
export function requestBrand(req: Request, supplied?: unknown): RealBrand {
  return parseBrand(supplied) ?? brandFromHost(req.headers.get('host'));
}
