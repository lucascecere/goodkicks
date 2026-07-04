'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';

export function CartIconButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
      className="relative p-2 text-town-navy hover:text-town-forest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-town-forest focus-visible:ring-offset-2 focus-visible:ring-offset-town-cream rounded"
    >
      <ShoppingBag size={19} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-town-forest text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
