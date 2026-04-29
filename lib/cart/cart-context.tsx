'use client';

import React, { createContext, useContext, useState, useOptimistic, useCallback } from 'react';
import type { ShopifyCart } from '@/lib/shopify/types';
import { flattenCartLines } from '@/lib/shopify/transforms';

interface CartContextValue {
  cart: ShopifyCart | null;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode;
  initialCart: ShopifyCart | null;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [optimisticCart, setOptimisticCart] = useOptimistic(initialCart);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleCart = useCallback(() => setCartOpen((prev) => !prev), []);

  const itemCount = optimisticCart?.totalQuantity ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart: optimisticCart,
        cartOpen,
        openCart,
        closeCart,
        toggleCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
