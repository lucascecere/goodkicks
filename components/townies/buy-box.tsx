'use client';

import { useEffect, useRef, useState } from 'react';
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
  preorder = false,
  shipNote,
  stockNote,
}: {
  variants: BuyVariant[];
  productTitle: string;
  imageUrl?: string;
  flavor?: 'townies' | 'goodkicks';
  preorder?: boolean;
  shipNote?: string;
  /** "In stock · only 4 left · ships now" — from real inventory, or undefined. */
  stockNote?: string | null;
}) {
  const { addItem, openCart } = useCart();
  // Phones: a sticky Add to cart bar whenever the real button is off screen
  // (it starts below the fold under the photo, title and description).
  const mainBtn = useRef<HTMLButtonElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = mainBtn.current;
    if (!el || flavor !== 'townies') return;
    let offScreen = false;
    // Step aside near the bottom so it never sits on the sign-up band or footer.
    const update = () => {
      const h = document.documentElement;
      const nearEnd = h.scrollTop + h.clientHeight > h.scrollHeight - 900;
      setShowBar(offScreen && !nearEnd);
    };
    const io = new IntersectionObserver(([e]) => {
      offScreen = !e.isIntersecting;
      update();
    }, { rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', update);
    };
  }, [flavor]);
  const [selectedId, setSelectedId] = useState(
    variants.find((v) => v.available)?.id ?? variants[0]?.id,
  );

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!selected) return null;

  // Colour comes from the semantic tokens under whichever [data-brand] scope
  // this renders in; `flavor` only tags the cart line with its origin.
  const accent = 'bg-accent hover:bg-accent/90 focus-visible:ring-accent';
  const ring = 'border-text text-text';

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
      // Preorder lines get a VISIBLE fulfillment note so it shows at checkout + on
      // the order (no leading underscore).
      customAttributes: [
        { key: '_brand', value: flavor },
        ...(preorder
          ? [{ key: 'Fulfillment', value: `Pre-order${shipNote ? ` — ${shipNote}` : ''}` }]
          : []),
      ],
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

      <div className="space-y-3">
        <button
          ref={mainBtn}
          onClick={handleAdd}
          disabled={!selected.available}
          className={cn(
            'w-full text-accent-contrast py-4 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed',
            accent,
          )}
        >
          {selected.available ? (preorder ? 'Pre-order' : 'Add to cart') : 'Sold out'}
        </button>
        {preorder && selected.available && shipNote && (
          <p className="text-center text-xs uppercase tracking-[0.14em] text-muted">
            Pre-order · {shipNote}
          </p>
        )}
        {!preorder && selected.available && stockNote && (
          <p className="text-center text-xs uppercase tracking-[0.14em] text-muted">
            {stockNote}
          </p>
        )}
      </div>

      {flavor === 'townies' && (
        <div
          aria-hidden={!showBar}
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white/95 px-4 pt-3 backdrop-blur transition-transform duration-300 lg:hidden',
            'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
            showBar ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.875rem] font-semibold text-text">{productTitle}</p>
              <p className="text-[0.8125rem] text-muted">
                {price}
                {preorder && selected.available ? ' · Pre-order' : stockNote && selected.available ? ` · ${stockNote.split('·')[1]?.trim() ?? ''}` : ''}
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={!selected.available}
              tabIndex={showBar ? 0 : -1}
              className={cn(
                'shrink-0 rounded-sm px-6 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-accent-contrast disabled:opacity-50',
                accent,
              )}
            >
              {selected.available ? (preorder ? 'Pre-order' : 'Add to cart') : 'Sold out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
