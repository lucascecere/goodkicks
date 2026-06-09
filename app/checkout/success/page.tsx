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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="font-display text-4xl text-brand-ink">order confirmed!</h1>
        <p className="text-brand-muted leading-relaxed">
          you&apos;re in the circle now. we&apos;ll send a confirmation to your email. your sack is made to order and ships within 1–2 weeks.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-brand-rust text-white px-6 py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors"
          >
            keep shopping
          </Link>
          <Link
            href="/blog"
            className="border border-brand-rule text-brand-ink px-6 py-3 rounded font-medium hover:border-brand-ink transition-colors"
          >
            read the stitch
          </Link>
        </div>
      </div>
    </div>
  );
}
