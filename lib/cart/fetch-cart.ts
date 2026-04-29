import { storefrontClient } from '@/lib/shopify/client';
import { CART_QUERY } from '@/lib/shopify/queries';
import type { ShopifyCart } from '@/lib/shopify/types';

export async function fetchCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const { data, errors } = await storefrontClient.request(CART_QUERY, {
      variables: { cartId },
    });
    if (errors || !data?.cart) {
      return null;
    }
    return data.cart as ShopifyCart;
  } catch {
    return null;
  }
}
