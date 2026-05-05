import { storefrontClient } from './client';
import { PRODUCT_BY_HANDLE_QUERY } from './queries';
import { CART_CREATE_MUTATION } from './mutations';
import type { ShopifyProduct, ShopifyCart } from './types';

interface ProductQueryResult {
  product: ShopifyProduct;
}

interface CartCreateResult {
  cartCreate: {
    cart: ShopifyCart;
    userErrors: Array<{ field: string[]; message: string }>;
  };
}

interface ShopQueryResult {
  shop: { name: string; primaryDomain: { url: string } };
}

const SHOP_QUERY = `
  query {
    shop {
      name
      primaryDomain { url }
    }
  }
`;

export async function getShopInfo() {
  const { data, errors } = await storefrontClient.request<ShopQueryResult>(SHOP_QUERY);
  if (errors) throw new Error(errors.networkStatusCode?.toString() ?? 'Shopify error');
  return data?.shop ?? null;
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  try {
    const { data, errors } = await storefrontClient.request<ProductQueryResult>(
      PRODUCT_BY_HANDLE_QUERY,
      { variables: { handle } }
    );
    if (errors || !data?.product) return null;
    return data.product;
  } catch {
    return null;
  }
}

export async function createShopifyCart(
  lines: Array<{ merchandiseId: string; quantity: number }>,
  discountCodes?: string[]
): Promise<{ cartId: string; checkoutUrl: string } | null> {
  try {
    const { data, errors } = await storefrontClient.request<CartCreateResult>(
      CART_CREATE_MUTATION,
      { variables: { lines, discountCodes: discountCodes ?? [] } }
    );
    if (errors || !data?.cartCreate?.cart) return null;
    const cart = data.cartCreate.cart;
    return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
  } catch {
    return null;
  }
}
