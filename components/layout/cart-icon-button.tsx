'use client';

// Shared between both brands' headers, so it uses the semantic tokens rather
// than town-* — otherwise the Good Kicks header renders a Townies navy cart
// icon with a forest badge on a cream page.

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';

export function CartIconButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
      className="relative p-2 text-text hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded"
    >
      <ShoppingBag size={19} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
