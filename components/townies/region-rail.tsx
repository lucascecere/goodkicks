'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MaMark } from '@/components/brand/wordmark';

/**
 * One row of region cards that scrolls sideways — the same rail mechanics as
 * the product rail. A grid put three cards on one line and the fourth alone
 * on the next; a rail has no orphan row, and it keeps working as regions are
 * added.
 *
 * EACH CARD NOW OPENS WITH A PICTURE (2026-09-22): the hats that region
 * actually contains, fanned on a cream panel. The band was four blocks of type
 * on navy, which is the right answer to "no region has been photographed as a
 * region" — a stock harbour standing in for the South Shore is exactly what the
 * brand guidelines forbid — but the wrong answer to "show me what I'd be
 * buying". Real product photography is the honest picture here: it promises
 * nothing about a place, only about the hats, and every one of them is a shot
 * we own.
 *
 * So: no landscapes, no stock, no AI. If a region has no hats it has no photo
 * panel and the card renders as type, exactly as before.
 *
 * ONE image per card, cropped to fill. A three-up fan was tried first and broke
 * the moment a region mixed a hat-on-a-white-sweep with a hat-on-a-curb: the
 * contained shots floated and the full-frame one filled, and the row read as a
 * mistake. Filling the panel makes every card the same object regardless of how
 * its photograph was taken — a white-sweep shot crops to the hat, because the
 * hat is always centred in those frames.
 */
export type RegionCard = {
  key: string;
  href: string;
  title: string;
  count?: string;
  body: string;
  cta: string;
  /** Up to three real product shots from this region, fanned on the panel. */
  images?: Array<{ url: string; alt: string }>;
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
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="max-w-2xl">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-2">
            Shop by region
          </p>
          <h2 className="font-block font-bold uppercase text-3xl sm:text-4xl lg:text-[2.75rem] leading-[0.95] tracking-[0.015em] text-white">
            Where are you from?
          </h2>
          <p className="mt-3 text-sm text-town-cream/70">
            Filed by coast and county. Every Massachusetts town, eventually.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-block shrink-0 text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/85 hover:text-white transition-colors"
        >
          Every town
        </Link>
      <div className="hidden sm:flex items-center gap-2">
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
            className={`group flex w-[78vw] sm:w-[320px] lg:w-[340px] shrink-0 snap-start flex-col overflow-hidden rounded-sm transition-colors ${
              c.dashed
                ? 'border border-dashed border-town-cream/30 hover:border-town-cream/60 p-5 sm:p-6'
                : 'border border-town-cream/15 bg-town-cream/[0.04] hover:bg-town-cream/[0.09] hover:border-town-cream/30'
            }`}
          >
            {c.images && c.images.length > 0 && (
              <div className="relative h-44 overflow-hidden bg-town-cream sm:h-48">
                <Image
                  src={c.images[0].url}
                  alt={c.images[0].alt}
                  fill
                  sizes="(min-width: 1024px) 340px, 78vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                {/* A whisper of navy at the foot of the panel so the card's
                    type never starts hard against a bright crop. */}
                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-town-navy/25 to-transparent" />
              </div>
            )}
            <div className={c.dashed ? 'contents' : 'flex flex-1 flex-col p-5 sm:p-6'}>
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
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
