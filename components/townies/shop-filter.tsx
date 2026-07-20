'use client';

import { useState } from 'react';
import { ProductCard } from './product-card';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { cn } from '@/lib/utils';

// One shop page, filtered by town tabs. Client-side filter for instant switching;
// syncs the active town to the URL (?town=) so it's shareable + deep-linkable from
// the homepage town cards. Built to grow: the tab row is where a "Filter" popup +
// sort control will slot in next.

export type ShopItem = { product: CollectionProduct; slug: string; name: string };
export type TownTab = { slug: string; name: string };

export function ShopFilter({
  items,
  towns,
  initialTown,
}: {
  items: ShopItem[];
  towns: TownTab[];
  initialTown?: string;
}) {
  const start = initialTown && towns.some((t) => t.slug === initialTown) ? initialTown : 'all';
  const [active, setActive] = useState(start);

  function pick(slug: string) {
    setActive(slug);
    window.history.replaceState(null, '', slug === 'all' ? '/shop' : `/shop?town=${slug}`);
  }

  const shown = active === 'all' ? items : items.filter((i) => i.slug === active);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tab label="All" active={active === 'all'} onClick={() => pick('all')} />
        {towns.map((t) => (
          <Tab key={t.slug} label={t.name} active={active === t.slug} onClick={() => pick(t.slug)} />
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-town-muted text-sm py-16">
          Nothing here yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {shown.map((i, idx) => (
            <ProductCard key={i.product.id} product={i.product} priority={idx < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors',
        active
          ? 'bg-town-navy text-town-cream border-town-navy'
          : 'bg-transparent text-town-navy/60 border-town-rule hover:text-town-navy hover:border-town-navy/40',
      )}
    >
      {label}
    </button>
  );
}
