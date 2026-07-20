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
    <section className="relative min-h-[82vh] flex items-center overflow-hidden bg-town-navy text-white">
      <BrandPattern variant="ma" color="cream" opacity={0.08} size={220} fade="radial" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-24 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-town-cream/60 mb-4">
          Coming soon
        </p>
        <h1 className="font-block uppercase text-6xl sm:text-8xl leading-[0.9] mb-6">
          {region}
        </h1>
        <p className="text-town-cream/70 max-w-md mx-auto mb-9 leading-relaxed">
          {blurb}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/shop"
            className="inline-flex items-center bg-town-cream text-town-navy px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            Shop what&apos;s live
          </Link>
          <Link
            href="/contact"
            className="text-sm lowercase tracking-wide text-town-cream/90 underline underline-offset-4 hover:text-white transition-colors"
          >
            request your town
          </Link>
        </div>
      </div>
    </section>
  );
}
