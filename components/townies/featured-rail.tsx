'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { townKey } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * The catalogue as an editorial rail rather than a bordered product grid.
 *
 * Three deliberate departures from `ProductCard`, which stays as it is for
 * /shop where a grid of prices is the right answer:
 *
 *  1. NO CARD BORDER and a cream tile, not a white one. A white bordered box on
 *     a cream page draws a rectangle around every hat; on the homepage the hat
 *     should be the only edge you see.
 *  2. NO PRICE. This section is browse, not compare — the price is one click
 *     away on the product page, where a decision actually gets made.
 *  3. An uppercase underlined TEXT LINK per item instead of a whole clickable
 *     card, so the eye has something to read down the row.
 *
 * `showPrice` exists as an escape hatch: if homepage → product click-through
 * drops, turning prices back on is one prop rather than a rebuild.
 */
export function FeaturedRail({
  products,
  eyebrow = 'The latest',
  title = 'Every town we’ve done.',
  link = { href: '/shop', label: 'See all' },
  showPrice = false,
}: {
  products: CollectionProduct[];
  eyebrow?: string;
  title?: string;
  link?: { href: string; label: string };
  showPrice?: boolean;
}) {
  const rail = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (dir: -1 | 1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    // WHITE, not cream. Every Shopify shot is a hat on a white sweep, so a tile
    // of any other colour draws a hard white rectangle around each product —
    // which is the bordered-grid look this section exists to get away from. On
    // white the tile edge vanishes and the hats float on the page. Swap the
    // ground to cream the day the catalogue is reshot on a warm backdrop.
    <section className="bg-white border-y border-town-rule py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <SectionHeader eyebrow={eyebrow} title={title} link={link} />
          </div>
          <div className="hidden sm:flex items-center gap-2 mb-6 sm:mb-8 ml-4">
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scroll(dir)}
                aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
                className="grid h-8 w-8 place-items-center rounded-full border border-town-rule text-town-navy transition-colors hover:bg-town-navy hover:text-town-cream"
              >
                {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={rail}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => {
          const town = townKey(p).name;
          const price = p.variants.edges[0]?.node.price;
          return (
            <article key={p.id} className="w-[62vw] sm:w-[280px] lg:w-[300px] shrink-0 snap-start">
              <Link href={`/products/${p.handle}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  {p.featuredImage?.url ? (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      fill
                      sizes="(min-width: 1024px) 300px, 62vw"
                      priority={i < 2}
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-town-rule" />
                  )}
                </div>
                <p className="mt-3 text-sm text-town-navy">{p.title}</p>
                {showPrice && price && (
                  <p className="mt-0.5 text-sm text-town-muted">
                    ${Number(price.amount).toFixed(2).replace(/\.00$/, '')}
                  </p>
                )}
                <span className="mt-1.5 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-navy group-hover:text-town-forest transition-colors">
                  Shop {town}
                </span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
