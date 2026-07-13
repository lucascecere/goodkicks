import { CART_CREATE_MUTATION } from './mutations';
import { storefrontClient } from './client';
import type { ShopifyCart } from './types';

function shopifyFetch(query: string, variables?: Record<string, unknown>) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  return fetch(`https://${domain}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token ?? '',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  }).then((r) => r.json());
}

const PRODUCT_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      tags
      featuredImage {
        url
        altText
      }
      variants(first: 20) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

const ALL_PRODUCTS_QUERY = `
  query {
    products(first: 20) {
      edges {
        node {
          id
          title
          handle
          tags
          featuredImage {
            url
            altText
          }
          variants(first: 1) {
            edges {
              node {
                id
                availableForSale
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

const SHOP_QUERY = `{ shop { name primaryDomain { url } } }`;

export async function getShopInfo() {
  const json = await shopifyFetch(SHOP_QUERY);
  return json?.data?.shop ?? null;
}

export async function getProductByHandle(handle: string) {
  const json = await shopifyFetch(PRODUCT_QUERY, { handle });
  if (json?.errors) console.error('[shopify]', JSON.stringify(json.errors));
  return json?.data?.product ?? null;
}

export async function getAllProducts() {
  const json = await shopifyFetch(ALL_PRODUCTS_QUERY);
  if (json?.errors) console.error('[shopify]', JSON.stringify(json.errors));
  return json?.data?.products?.edges?.map((e: { node: unknown }) => e.node) ?? [];
}

interface CartCreateResult {
  cartCreate: {
    cart: ShopifyCart;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

export async function createShopifyCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
  discountCodes?: string[]
): Promise<{ cartId: string; checkoutUrl: string } | null> {
  console.log('[createShopifyCart] domain:', process.env.SHOPIFY_STORE_DOMAIN, 'token set:', !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
  try {
    const { data, errors } = await storefrontClient.request<CartCreateResult>(
      CART_CREATE_MUTATION,
      { variables: { lines, discountCodes: discountCodes ?? [] } }
    );
    if (errors) {
      console.error('[createShopifyCart] errors:', JSON.stringify(errors));
      return null;
    }
    if (!data?.cartCreate?.cart) {
      console.error('[createShopifyCart] no cart in response:', JSON.stringify(data));
      return null;
    }
    const cart = data.cartCreate.cart;
    return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
  } catch (err) {
    console.error('[createShopifyCart] threw:', err);
    return null;
  }
}
