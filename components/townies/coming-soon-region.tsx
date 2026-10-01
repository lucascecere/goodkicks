import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';

/**
 * Coming-soon landing for a region that hasn't dropped yet (Boston, North
 * Shore). South Shore ships first; these hold the region's spot in the nav and
 * push visitors to the live South Shore lineup + the town list.
 */
export function ComingSoonRegion({
  region,
  blurb,
}: {
  region: string;
  blurb: string;
}) {
  return (
    <section className="relative min-h-[82vh] flex items-center overflow-hidden bg-ink text-white">
      <BrandPattern variant="ma" color="cream" opacity={0.08} size={340} fade="radial" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-24 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/60 mb-4">
          Coming soon
        </p>
        <h1 className="display text-[2.5rem] sm:text-[3.25rem] lg:text-[4rem] mb-5">
          {region}
        </h1>
        <p className="text-ink-contrast/70 max-w-md mx-auto mb-9 leading-relaxed">
          {blurb}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/shop"
            className="inline-flex items-center bg-accent text-accent-contrast px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            Shop what&apos;s live
          </Link>
          <Link
            href="/request-a-town"
            className="text-sm lowercase tracking-wide text-ink-contrast/90 underline underline-offset-4 hover:text-white transition-colors"
          >
            request your town
          </Link>
        </div>
      </div>
    </section>
  );
}
