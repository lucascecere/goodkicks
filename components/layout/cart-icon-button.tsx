'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';

export function CartIconButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
      className="relative p-2 text-brand-ink hover:text-brand-rust transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rust focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream rounded"
    >
      <ShoppingBag size={20} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-rust text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
