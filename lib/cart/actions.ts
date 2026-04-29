'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { storefrontClient } from '@/lib/shopify/client';
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from '@/lib/shopify/mutations';
import type { ShopifyCart } from '@/lib/shopify/types';
import { CART_COOKIE } from './cookies';

async function getCartIdFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE)?.value;
}

async function saveCartId(cartId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
}

export async function addToCart(
  variantId: string,
  quantity: number = 1
): Promise<ShopifyCart> {
  const existingCartId = await getCartIdFromCookie();

  if (!existingCartId) {
    const { data } = await storefrontClient.request(CART_CREATE_MUTATION, {
      variables: {
        lines: [{ merchandiseId: variantId, quantity }],
      },
    });
    const cart = data.cartCreate.cart as ShopifyCart;
    await saveCartId(cart.id);
    revalidatePath('/', 'layout');
    return cart;
  }

  const { data } = await storefrontClient.request(CART_LINES_ADD_MUTATION, {
    variables: {
      cartId: existingCartId,
      lines: [{ merchandiseId: variantId, quantity }],
    },
  });
  revalidatePath('/', 'layout');
  return data.cartLinesAdd.cart as ShopifyCart;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const { data } = await storefrontClient.request(CART_LINES_UPDATE_MUTATION, {
    variables: {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
  });
  revalidatePath('/', 'layout');
  return data.cartLinesUpdate.cart as ShopifyCart;
}

export async function removeFromCart(
  cartId: string,
  lineId: string
): Promise<ShopifyCart> {
  const { data } = await storefrontClient.request(CART_LINES_REMOVE_MUTATION, {
    variables: {
      cartId,
      lineIds: [lineId],
    },
  });
  revalidatePath('/', 'layout');
  return data.cartLinesRemove.cart as ShopifyCart;
}
