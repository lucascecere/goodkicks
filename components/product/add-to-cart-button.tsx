'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { addToCart } from '@/lib/cart/actions';
import { useCart } from '@/lib/cart/cart-context';

interface AddToCartButtonProps {
  variantId: string;
  availableForSale: boolean;
}

export function AddToCartButton({ variantId, availableForSale }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const { openCart } = useCart();

  if (!availableForSale) {
    return (
      <Button variant="secondary" size="lg" disabled className="w-full">
        sold out
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      disabled={isPending}
      className="w-full"
      onClick={() => {
        startTransition(async () => {
          await addToCart(variantId, 1);
          openCart();
        });
      }}
    >
      {isPending ? 'adding...' : 'add to bag'}
    </Button>
  );
}
