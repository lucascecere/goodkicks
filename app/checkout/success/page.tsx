'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/cart-context';

export default function SuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-town-cream">
      <div className="max-w-md text-center space-y-6 py-16">
        <h1 className="font-block uppercase text-4xl sm:text-5xl text-town-navy leading-[0.95]">
          Order confirmed.
        </h1>
        <p className="text-town-muted leading-relaxed">
          You&apos;re all set — thanks for repping local. A confirmation&apos;s on its
          way to your inbox. Pre-order hats ship in about 3–4 weeks; anything in stock
          is out the door in a few days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop"
            className="bg-town-navy text-town-cream px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
          >
            Keep shopping
          </Link>
          <Link
            href="/"
            className="border border-town-navy/20 text-town-navy px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:border-town-navy transition-colors"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
