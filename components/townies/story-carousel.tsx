'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TownCard } from './town-card';
import { BrandImage } from '@/components/ui/brand-image';
import type { TownView } from '@/lib/townies/towns';

/**
 * Tall-portrait story carousel for featured towns/regions. Horizontal snap
 * scroll with quiet arrow controls. Ends with the Good Kicks "where we started"
 * origin card linking to /clearance.
 */
export function StoryCarousel({
  towns,
  includeOrigin = true,
}: {
  towns: TownView[];
  includeOrigin?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-end justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-2">
            Featured towns
          </p>
          <h2 className="font-block uppercase text-3xl sm:text-4xl text-town-navy">
            Find your roots.
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="p-2 border border-town-rule rounded-full text-town-navy hover:bg-town-navy hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Next"
            className="p-2 border border-town-rule rounded-full text-town-navy hover:bg-town-navy hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 px-4 sm:px-8 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {towns.map((town, i) => (
          <TownCard
            key={town.id}
            town={town}
            priority={i === 0}
            className="snap-start shrink-0 w-[72vw] sm:w-[300px] lg:w-[320px]"
          />
        ))}

        {includeOrigin && <OriginCard />}
      </div>
    </div>
  );
}

/** Good Kicks — our sister brand. */
function OriginCard() {
  return (
    <Link
      href="/goodkicks"
      className="group relative block overflow-hidden rounded-sm bg-brand-cream aspect-[11/16] snap-start shrink-0 w-[72vw] sm:w-[300px] lg:w-[320px]"
    >
      <BrandImage src={null} alt="Good Kicks — our sister brand" tone="cream" label="Good Kicks" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/75 via-brand-ink/10 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 text-white">
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-brand-cream/80 mb-1">
          Our sister brand
        </span>
        <h3 className="font-block uppercase leading-[0.9] text-3xl sm:text-4xl">
          Good Kicks
        </h3>
        <span className="mt-2 text-xs uppercase tracking-[0.18em] text-white/90 underline-offset-4 group-hover:underline">
          visit Good Kicks →
        </span>
      </div>
    </Link>
  );
}
