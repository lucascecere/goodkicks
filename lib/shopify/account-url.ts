// Where "Account" sends a customer.
//
// Both the Townies header and footer pointed at
// https://goodkicks.myshopify.com/account, which 404s — that subdomain does not
// exist. The store's actual myshopify domain is good-kicks-foot-bags-2, and
// hitting /account there just redirects here anyway. So this is the real
// destination, and it has the side benefit of not flashing a Good-Kicks-named
// URL at a Townies customer on the way.
//
// Hardcoded rather than derived from SHOPIFY_STORE_DOMAIN because the header and
// footer are client components and that variable is server-only. The store id is
// stable for the life of the store.

export const SHOPIFY_ACCOUNT_URL = 'https://shopify.com/76213584027/account';
