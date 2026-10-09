'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { bagCount, useBag } from '@/lib/shop/bag';
import { MARKET_BASE } from '@/lib/shop/paths';

// The market's own bag, floating bottom-right on every market page. Hidden
// while empty so it never competes with the site's main cart.
export function BagButton() {
  const count = bagCount(useBag());
  if (!count) return null;
  return (
    <Link
      href={`${MARKET_BASE}/bag`}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-text px-5 py-3.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg sm:bottom-8 sm:right-8"
    >
      <ShoppingBag className="h-4 w-4" strokeWidth={2} />
      Market bag · {count}
    </Link>
  );
}
