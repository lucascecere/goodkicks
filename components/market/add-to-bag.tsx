'use client';

import { useState } from 'react';
import Link from 'next/link';
import { addToBag, type BagLine } from '@/lib/shop/bag';
import { MARKET_BASE } from '@/lib/shop/paths';

export function AddToBag({ line, compact = false }: { line: Omit<BagLine, 'qty'>; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  return (
    <div className={compact ? '' : 'space-y-2'}>
      <button
        type="button"
        onClick={() => {
          addToBag(line);
          setAdded(true);
        }}
        className={`w-full bg-accent font-label font-bold uppercase tracking-[0.16em] text-accent-contrast transition-opacity hover:opacity-90 ${
          compact ? 'px-3 py-2.5 text-[0.6875rem]' : 'px-6 py-4 text-xs'
        }`}
      >
        {added ? 'Added. Add another' : 'Add to bag'}
      </button>
      {added && !compact && (
        <Link href={`${MARKET_BASE}/bag`} className="block text-center text-sm text-text underline underline-offset-4">
          Go to bag
        </Link>
      )}
    </div>
  );
}
