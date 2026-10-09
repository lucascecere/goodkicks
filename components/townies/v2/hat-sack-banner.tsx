import Image from 'next/image';
import Link from 'next/link';
import { HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';

// The Hat & Sack offer as a banner across the top of the shop, so the bundle
// is pushed where people are already choosing a hat (it no longer has its own
// menu item). Forest is the site's one "band" colour.
export function HatSackBanner({ fromCents }: { fromCents: number }) {
  return (
    <Link href={HAT_SACK_PATH} className="group block bg-band text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:gap-8 sm:px-8 sm:py-5">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#F1EEE8] sm:h-16 sm:w-16">
            <Image src="/brand/product/mil-front15.jpg" alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" />
          </div>
          <span className="font-block text-xl font-bold text-white/70">+</span>
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#F1EEE8] sm:h-16 sm:w-16">
            <Image src="/brand/product/gk-sack-massachusetts.jpg" alt="" fill sizes="64px" className="object-contain p-2 mix-blend-multiply" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-label text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/70">The Hat &amp; Sack</p>
          <p className="mt-0.5 text-[0.9375rem] leading-snug sm:text-[1.0625rem]">
            Any hat plus a Good Kicks foot bag, <span className="font-semibold">from {formatUsd(fromCents)}, shipping included.</span>
          </p>
        </div>
        <span className="hidden shrink-0 border border-white/60 px-5 py-3 font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] transition-colors group-hover:bg-white group-hover:text-band sm:inline-block">
          Build yours
        </span>
        <span className="shrink-0 font-label text-lg sm:hidden" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
