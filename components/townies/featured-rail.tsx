'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { townKey } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { QuickAdd } from './quick-add';
import { cn } from '@/lib/utils';

/**
 * The catalogue as an editorial rail rather than a bordered product grid.
 *
 * NO CARD BORDER, and the hat floats on white — on the homepage the hat should
 * be the only edge you see.
 *
 * PRICE AND ADD-TO-CART ARE ON BY DEFAULT as of 2026-09-22, reversing the
 * original rule. The argument for hiding them was that this row is "browse, not
 * compare" and the price is one click away. In practice the row asked a visitor
 * to open a product page to learn a number and then open another to compare it,
 * and the escape hatch the old comment describes — flip `showPrice` if
 * click-through drops — is exactly the situation the page was in. Every hat has
 * one variant, so the whole buy is one click from here.
 *
 * Pass `showPrice={false}` / `quickAdd={false}` for a row that is genuinely
 * editorial — a lookbook or a story — rather than a shelf.
 */
export function FeaturedRail({
  products,
  eyebrow = 'The latest',
  title = 'Every town we’ve done.',
  link = { href: '/shop', label: 'See all' },
  showPrice = true,
  quickAdd = true,
  align = 'left',
  sub,
  flavor = 'townies',
  productBase = '/products',
  names,
  fit = 'contain',
}: {
  products: CollectionProduct[];
  eyebrow?: string;
  title?: string;
  sub?: string;
  link?: { href: string; label: string };
  showPrice?: boolean;
  /** The add-to-cart button under each card. */
  quickAdd?: boolean;
  /** 'center' for a standalone collection row; 'left' keeps the arrows on the title line. */
  align?: 'left' | 'center';
  /** Tags the cart line with its origin brand. */
  flavor?: 'townies' | 'goodkicks';
  /** Where a card links — '/products' for Townies, '/goodkicks/products' for GK. */
  productBase?: string;
  /**
   * Display name per handle. Plain data, not a function — this is a client
   * component and the server page cannot hand it a callback. When given, the
   * card title and the "Shop …" link both use it; otherwise the Townies rule
   * applies (product title, link to the town).
   */
  names?: Record<string, string>;
  /** 'cover' for full-frame photography (Good Kicks); Townies hats stay contained. */
  fit?: 'contain' | 'cover';
}) {
  const rail = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const centred = align === 'center';

  const scroll = (dir: -1 | 1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const arrow = (dir: -1 | 1) => (
    <button
      key={dir}
      type="button"
      onClick={() => scroll(dir)}
      aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
      className="grid h-8 w-8 place-items-center rounded-full border border-rule text-text transition-colors hover:bg-ink hover:text-ink-contrast"
    >
      {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
    </button>
  );

  return (
    // WHITE, not cream. Every Shopify shot is a hat on a white sweep, so a tile
    // of any other colour draws a hard white rectangle around each product —
    // which is the bordered-grid look this section exists to get away from. On
    // white the tile edge vanishes and the hats float on the page. Swap the
    // ground to cream the day the catalogue is reshot on a warm backdrop.
    <section className="bg-white border-y border-rule py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Centred: the heading stands alone and the two controls share ONE row
            beneath it — arrow, "see all", arrow. Rendering the section link and
            the arrows as separate blocks stacked them into 90px of empty page
            between the title and the first hat. Left-aligned keeps the original
            arrangement, arrows out on the title line. */}
        {centred ? (
          <>
            <SectionHeader eyebrow={eyebrow} title={title} sub={sub} align="center" />
            <div className="-mt-3 mb-8 flex items-center justify-center gap-4">
              {arrow(-1)}
              {link && (
                <Link
                  href={link.href}
                  className="text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-text hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              )}
              {arrow(1)}
            </div>
          </>
        ) : (
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <SectionHeader eyebrow={eyebrow} title={title} sub={sub} link={link} align="left" />
            </div>
            <div className="hidden sm:flex items-center gap-2 mb-6 sm:mb-8 ml-4">
              {arrow(-1)}
              {arrow(1)}
            </div>
          </div>
        )}
      </div>

      <div
        ref={rail}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => {
          const price = p.variants.edges[0]?.node.price;
          const name = names?.[p.handle] ?? p.title;
          const label = `Shop ${names ? name : townKey(p).name}`;
          return (
            <article key={p.id} className="w-[62vw] sm:w-[280px] lg:w-[300px] shrink-0 snap-start">
              <Link href={`${productBase}/${p.handle}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  {p.featuredImage?.url ? (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      fill
                      sizes="(min-width: 1024px) 300px, 62vw"
                      priority={i < 2}
                      className={`${fit === 'cover' ? 'object-cover' : 'object-contain p-6'} transition-transform duration-500 group-hover:scale-[1.03]`}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-rule" />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-text group-hover:text-accent transition-colors">
                  {name}
                </p>
                {showPrice && price ? (
                  <p className="mt-0.5 text-sm text-muted">
                    ${Number(price.amount).toFixed(2).replace(/\.00$/, '')}
                  </p>
                ) : (
                  <span className="mt-1.5 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-text group-hover:text-accent transition-colors">
                    {label}
                  </span>
                )}
              </Link>
              {/* OUTSIDE the Link. Nesting a button inside an anchor is invalid
                  HTML and leaves the browser to guess which one a click meant —
                  the add fires and the navigation races it. */}
              {quickAdd && <QuickAdd product={p} flavor={flavor} title={names?.[p.handle]} />}
            </article>
          );
        })}
      </div>
    </section>
  );
}
