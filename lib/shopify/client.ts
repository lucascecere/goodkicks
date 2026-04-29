import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Use placeholder values at build time so Next.js can evaluate the module.
// Requests will fail gracefully (caught by callers) if vars are missing at runtime.
export const storefrontClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN ?? 'placeholder.myshopify.com',
  apiVersion: '2026-04',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '',
});
