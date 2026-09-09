'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MaMark } from '@/components/brand/wordmark';

/**
 * One row of region cards that scrolls sideways — the same rail mechanics as
 * the product rail. A grid put three cards on one line and the fourth alone
 * on the next; a rail has no orphan row, and it keeps working as regions are
 * added.
 */
export type RegionCard = {
  key: string;
  href: string;
  title: string;
  count?: string;
  body: string;
  cta: string;
  /** The dashed "your town" card. */
  dashed?: boolean;
};

export function RegionRail({ cards }: { cards: RegionCard[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-2">
            Shop by region
          </p>
          <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-white">
            Where are you from?
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-block shrink-0 text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/85 hover:text-white transition-colors"
        >
          Every town
        </Link>
      <div className="hidden sm:flex items-center gap-2 ml-4">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => scroll(dir)}
            aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
            className="grid h-8 w-8 place-items-center rounded-full border border-town-cream/30 text-town-cream transition-colors hover:bg-town-cream hover:text-town-navy"
          >
            {dir === -1 ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
        ))}
      </div>
      </div>

      <div
        ref={rail}
        className="mt-8 sm:mt-10 -mx-4 sm:-mx-8 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className={`group flex w-[78vw] sm:w-[320px] lg:w-[340px] shrink-0 snap-start flex-col rounded-sm p-5 sm:p-6 transition-colors ${
              c.dashed
                ? 'border border-dashed border-town-cream/30 hover:border-town-cream/60'
                : 'border border-town-cream/15 bg-town-cream/[0.04] hover:bg-town-cream/[0.09] hover:border-town-cream/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-block font-bold uppercase text-lg sm:text-xl leading-none tracking-[0.015em] text-white">
                {c.title}
              </h3>
              {c.count && (
                <span className="text-[0.625rem] uppercase tracking-[0.18em] text-town-cream/60">{c.count}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-town-cream/80">{c.body}</p>
            <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-town-cream/85 group-hover:text-white transition-colors">
              {!c.dashed && <MaMark className="h-2 w-auto text-town-forest" />}
              <span className={c.dashed ? 'underline underline-offset-[6px] decoration-1' : ''}>{c.cta}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
