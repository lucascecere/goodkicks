import 'server-only';
import {
  shopifyAdminGraphQL,
  isShopifyAdminConfigured,
  ShopifyScopeError,
} from './admin-graphql';

// Can this store's token create discount codes?
//
// Worth answering up front rather than letting every approval fail first: if
// the token is missing `write_discounts`, the admin should show the by-hand
// flow immediately instead of an error the user has to decode once per rep.

export type DiscountReadiness = {
  ready: boolean;
  reason: string | null;
  /** Deep link to the store's Discounts page, for the create-by-hand path. */
  discountsUrl: string;
};

// Derived from the myshopify domain: good-kicks-foot-bags-2.myshopify.com
// → admin.shopify.com/store/good-kicks-foot-bags-2
function discountsUrl(): string {
  const handle = (process.env.SHOPIFY_STORE_DOMAIN ?? '').replace(/\.myshopify\.com$/, '');
  return handle
    ? `https://admin.shopify.com/store/${handle}/discounts`
    : 'https://admin.shopify.com';
}

let cached: DiscountReadiness | null = null;

export async function getDiscountReadiness(): Promise<DiscountReadiness> {
  // Scope changes require reinstalling the app and redeploying with the new
  // token, so a process-lifetime cache can't go stale in a way that matters.
  if (cached) return cached;

  const url = discountsUrl();

  if (!isShopifyAdminConfigured()) {
    cached = { ready: false, reason: 'Shopify Admin API is not configured.', discountsUrl: url };
    return cached;
  }

  try {
    await shopifyAdminGraphQL('{ codeDiscountNodes(first: 1) { nodes { id } } }');
    cached = { ready: true, reason: null, discountsUrl: url };
  } catch (err) {
    cached = {
      ready: false,
      reason:
        err instanceof ShopifyScopeError
          ? `This store's Shopify app is missing the \`${err.requiredScope}\` permission, so codes can't be created from here yet.`
          : err instanceof Error
            ? err.message
            : 'Could not reach Shopify.',
      discountsUrl: url,
    };
  }

  return cached;
}
