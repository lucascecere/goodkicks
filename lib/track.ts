/**
 * Fire a GA4 event when the gtag snippet is on the page (townies.shop only, see
 * components/analytics/google-analytics.tsx). A no-op anywhere else, and it
 * never throws: analytics must not break a click.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', event, params);
  } catch {}
}
