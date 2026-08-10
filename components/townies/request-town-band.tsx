import Link from 'next/link';
import { BrandPattern } from './brand-pattern';

/**
 * Closing CTA — forest green over the pine pattern.
 *
 * The single most useful thing a visitor who doesn't find their town can do is
 * tell us it's missing, so the page ends on that rather than on a newsletter
 * box. Pine (not MA) because every other band on the homepage is already
 * carrying the MA pattern, and four identical grounds read as one long page.
 */
export function RequestTownBand() {
  return (
    <section className="relative overflow-hidden bg-town-forest">
      <BrandPattern variant="pine" color="cream" opacity={0.1} size={300} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-town-cream/70 mb-4">
          Don’t see your town?
        </p>
        <h2 className="font-block uppercase text-4xl sm:text-6xl leading-[0.92] text-white mb-5">
          Tell us where you’re from.
        </h2>
        <p className="text-town-cream/85 leading-relaxed mb-9">
          Towns get made because people ask for them. Put yours in — if enough
          people from the same place raise their hand, it goes into the queue.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/request-a-town"
            className="inline-flex items-center bg-town-cream text-town-navy px-8 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            Request your town
          </Link>
          <Link
            href="/shop"
            className="text-sm lowercase tracking-wide text-town-cream/90 underline underline-offset-4 hover:text-white transition-colors"
          >
            see what’s live
          </Link>
        </div>
      </div>
    </section>
  );
}
