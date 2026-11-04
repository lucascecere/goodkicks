'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** One sideways row with arrow buttons (desktop) and swipe (phones). */
export function CrestRail({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const nudge = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const btn =
    'absolute top-[38px] sm:top-[44px] -translate-y-1/2 z-10 hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-white text-text shadow-sm transition hover:border-text';
  return (
    <div className="relative">
      <button type="button" aria-label="Previous towns" onClick={() => nudge(-1)} className={`${btn} -left-2 lg:-left-5`}>
        <ChevronLeft size={18} />
      </button>
      <ul
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:gap-7 sm:px-1 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      <button type="button" aria-label="More towns" onClick={() => nudge(1)} className={`${btn} -right-2 lg:-right-5`}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
