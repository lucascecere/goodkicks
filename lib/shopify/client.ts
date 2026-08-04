import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Fallback to placeholder values at build time — the SDK validates that the
// domain and token are non-empty, so we provide dummy strings. Requests made
// with placeholder credentials throw a network/auth error, caught by callers.
//
// `||` (not `??`): a BLANK env value is what actually shows up locally
// (.env.production carries empty placeholders), and `??` passes '' straight
// through to a constructor that rejects it — failing the build at "collect page
// data" rather than falling back as intended.
export const storefrontClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN || 'placeholder.myshopify.com',
  apiVersion: '2026-04',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'placeholder-build-token',
});
