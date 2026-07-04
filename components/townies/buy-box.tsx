'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/cart-context';
import { cn } from '@/lib/utils';

export type BuyVariant = {
  id: string;
  name: string;
  priceInCents: number;
  available: boolean;
};

/**
 * Variant switcher + add-to-cart. Uses the existing client CartContext
 * (localStorage + /api/checkout) — the cart architecture is untouched.
 */
export function BuyBox({
  variants,
  productTitle,
  imageUrl,
  flavor = 'townies',
}: {
  variants: BuyVariant[];
  productTitle: string;
  imageUrl?: string;
  flavor?: 'townies' | 'goodkicks';
}) {
  const { addItem, openCart } = useCart();
  const [selectedId, setSelectedId] = useState(
    variants.find((v) => v.available)?.id ?? variants[0]?.id,
  );

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!selected) return null;

  const accent =
    flavor === 'goodkicks'
      ? 'bg-brand-rust hover:bg-brand-rust/90 focus-visible:ring-brand-rust'
      : 'bg-town-forest hover:bg-town-forest/90 focus-visible:ring-town-forest';

  const ring =
    flavor === 'goodkicks' ? 'border-brand-rust text-brand-ink' : 'border-town-navy text-town-navy';

  const price = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: selected.priceInCents % 100 === 0 ? 0 : 2,
  }).format(selected.priceInCents / 100);

  function handleAdd() {
    addItem({
      variantId: selected.id,
      variantName: selected.name,
      productTitle,
      priceInCents: selected.priceInCents,
      imageUrl,
      // Tag the line by brand so the shared cart/checkout knows its origin.
      // Leading underscore = hidden from the Shopify checkout + our cart display.
      customAttributes: [{ key: '_brand', value: flavor }],
    });
    openCart();
  }

  const hasChoices = variants.length > 1;

  return (
    <div className="space-y-6">
      <p className="text-2xl font-medium text-text">{price}</p>

      {hasChoices && (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted mb-3">Style</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSel = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  disabled={!v.available}
                  className={cn(
                    'px-4 py-2 rounded-sm border text-sm transition-colors',
                    isSel ? ring : 'border-rule text-muted hover:border-text',
                    !v.available && 'opacity-40 line-through cursor-not-allowed',
                  )}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!selected.available}
        className={cn(
          'w-full text-white py-4 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed',
          accent,
        )}
      >
        {selected.available ? 'Add to cart' : 'Sold out'}
      </button>
    </div>
  );
}
