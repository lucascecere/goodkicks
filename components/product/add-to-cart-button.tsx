'use client';

import { useCart } from '@/lib/cart/cart-context';

interface AddToCartButtonProps {
  variant: {
    id: string;
    name: string;
    priceInCents: number;
  };
  productTitle: string;
}

export function AddToCartButton({ variant, productTitle }: AddToCartButtonProps) {
  const { addItem, openCart } = useCart();

  function handleClick() {
    addItem({
      variantId: variant.id,
      variantName: variant.name,
      productTitle,
      priceInCents: variant.priceInCents,
    });
    openCart();
  }

  return (
    <button
      onClick={handleClick}
      className="w-full bg-brand-rust text-white py-4 rounded font-medium hover:bg-brand-rust/90 transition-colors text-lg"
    >
      add to bag
    </button>
  );
}
