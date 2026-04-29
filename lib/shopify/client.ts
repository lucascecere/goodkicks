import { createStorefrontApiClient } from '@shopify/storefront-api-client';

if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
  throw new Error(
    'Missing Shopify environment variables. Copy .env.local.example to .env.local and fill in your credentials.'
  );
}

export const storefrontClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: '2026-04',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
});
