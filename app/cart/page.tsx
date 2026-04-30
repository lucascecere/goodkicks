'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/cart-context';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { openCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    openCart();
    router.replace('/');
  }, [openCart, router]);

  return null;
}
