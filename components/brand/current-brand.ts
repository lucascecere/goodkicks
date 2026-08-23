'use client';

// What brand is the browser currently showing?
//
// Forms use this to stamp their submission, so a Good Kicks signup is recorded
// as Good Kicks whether the visitor is on goodkicks.co or on
// townies.shop/goodkicks — the second case being one the server cannot work out
// on its own, since the POST carries Host: townies.shop.
//
// CALL AT SUBMIT TIME, NEVER DURING RENDER. During SSR there is no window, so a
// render-time call returns 'townies' on the server and possibly 'goodkicks' on
// the client — a hydration mismatch. Reading it inside the submit handler dodges
// that entirely, the same way BrandSwitcher reads its cookie after mount.

import { siteBrand, type RealBrand } from '@/lib/brand/site-brand';

export function currentBrand(): RealBrand {
  if (typeof window === 'undefined') return 'townies';
  return siteBrand(window.location.host, window.location.pathname);
}
