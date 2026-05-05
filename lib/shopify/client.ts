import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Fallback to placeholder values at build time — the SDK validates that the
// token is non-empty, so we provide a dummy string. Requests made with
// placeholder credentials will throw a network/auth error, caught by callers.
export const storefrontClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN ?? 'placeholder.myshopify.com',
  apiVersion: '2025-10',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? 'placeholder-build-token',
});
