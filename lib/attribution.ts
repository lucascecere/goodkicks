// Where did this shopper come from? Checkout runs on Shopify's domain, so
// Shopify only ever sees townies.shop as the referrer and every order reads
// "source: townies.shop". We keep the FIRST touch (UTMs, referrer, landing
// page) in localStorage and send it with the cart, so it lands on the order as
// "Additional details" in Shopify admin.

const KEY = 'townies_first_touch';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type FirstTouch = {
  source: string;
  medium?: string;
  campaign?: string;
  landing: string;
  referrer?: string;
  at: number;
};

function guessSource(referrer: string, ua: string): string {
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV/i.test(ua)) return 'facebook';
  if (/TikTok|musical_ly/i.test(ua)) return 'tiktok';
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === location.hostname.replace(/^www\./, '')) return 'direct';
    if (/instagram\.com$/.test(host)) return 'instagram';
    if (/facebook\.com$|fb\.me$/.test(host)) return 'facebook';
    if (/tiktok\.com$/.test(host)) return 'tiktok';
    if (/google\./.test(host)) return 'google';
    return host;
  } catch {
    return 'direct';
  }
}

/** Record the first touch once per 30 days. A visit with UTMs always wins. */
export function captureFirstTouch() {
  try {
    const params = new URLSearchParams(location.search);
    const utmSource = params.get('utm_source');
    const existing = readFirstTouch();
    if (existing && !utmSource) return;

    const touch: FirstTouch = {
      source: utmSource || guessSource(document.referrer, navigator.userAgent),
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      landing: location.pathname,
      referrer: document.referrer || undefined,
      at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(touch));
  } catch {}
}

export function readFirstTouch(): FirstTouch | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const touch = JSON.parse(raw) as FirstTouch;
    if (!touch?.source || Date.now() - touch.at > MAX_AGE_MS) return null;
    return touch;
  } catch {
    return null;
  }
}

/** Cart attributes for Shopify. Plain keys so they show on the order. */
export function firstTouchAttributes(): Array<{ key: string; value: string }> {
  const t = readFirstTouch();
  if (!t) return [];
  const pairs: Array<[string, string | undefined]> = [
    ['Source', t.source],
    ['Medium', t.medium],
    ['Campaign', t.campaign],
    ['Landing page', t.landing],
    ['Referrer', t.referrer],
    ['First visit', new Date(t.at).toISOString().slice(0, 10)],
  ];
  return pairs
    .filter((p): p is [string, string] => !!p[1])
    .map(([key, value]) => ({ key, value: value.slice(0, 200) }));
}
