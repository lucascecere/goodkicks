'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type CartItem = {
  cartKey?: string;
  variantId: string;
  variantName: string;
  productTitle: string;
  priceInCents: number;
  quantity: number;
  imageUrl?: string;
  customAttributes?: Array<{ key: string; value: string }>;
};

interface CartContextValue {
  items: CartItem[];
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  itemCount: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('goodkicks_cart');
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        setItems(parsed.map((i) => ({ cartKey: i.variantId, ...i })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('goodkicks_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleCart = useCallback(() => setCartOpen((v) => !v), []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    const key = item.cartKey ?? item.variantId;
    setItems((prev) => {
      const existing = prev.find((i) => (i.cartKey ?? i.variantId) === key);
      if (existing) {
        return prev.map((i) => (i.cartKey ?? i.variantId) === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, cartKey: key, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => (i.cartKey ?? i.variantId) !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => (i.cartKey ?? i.variantId) !== key));
    } else {
      setItems((prev) => prev.map((i) => (i.cartKey ?? i.variantId) === key ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem('goodkicks_cart'); } catch {}
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotalCents = items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, cartOpen, openCart, closeCart, toggleCart, itemCount, subtotalCents, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
