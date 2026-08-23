import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';

/**
 * Scrolling band of town names under the hero.
 *
 * Does the job a paragraph of "we cover these towns" would do, in a strip, and
 * gives the page its first hard horizontal edge — the homepage previously went
 * hero → white, with nothing to break the fall.
 *
 * The track is the town list duplicated exactly once because the `marquee`
 * keyframe translates -50%; any other multiple visibly jumps at the loop point.
 */
export function TownTicker({ towns }: { towns: string[] }) {
  if (towns.length === 0) return null;
  // A short list would leave gaps on a wide screen, so repeat it until the
  // track is comfortably longer than any viewport before duplicating.
  const padded = [...towns];
  while (padded.length < 14) padded.push(...towns);
  const run = [...padded, ...padded];

  return (
    <div className="relative overflow-hidden bg-town-navy py-3.5 sm:py-4">
      <div className="marquee-x flex w-max items-center">
        {run.map((town, i) => (
          <span key={`${town}-${i}`} className="flex items-center whitespace-nowrap">
            <span className="font-block uppercase text-town-cream/90 text-sm sm:text-base tracking-[0.06em] px-5 sm:px-7">
              {town}
            </span>
            <MaMark className="h-2.5 w-auto text-town-forest shrink-0" />
          </span>
        ))}
      </div>
      {/* Feathered ends so names don't get guillotined at the viewport edge. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-town-navy to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-town-navy to-transparent" />
    </div>
  );
}

/** Same band, but every name links to its town — used on the shop page. */
export function TownTickerLinked({ towns }: { towns: Array<{ slug: string; name: string }> }) {
  if (towns.length === 0) return null;
  const padded = [...towns];
  while (padded.length < 14) padded.push(...towns);
  const run = [...padded, ...padded];

  return (
    <div className="relative overflow-hidden bg-town-navy py-3.5">
      <div className="marquee-x flex w-max items-center">
        {run.map((t, i) => (
          <span key={`${t.slug}-${i}`} className="flex items-center whitespace-nowrap">
            <Link
              href={`/shop?town=${t.slug}`}
              className="font-block uppercase text-town-cream/90 hover:text-white text-sm sm:text-base tracking-[0.06em] px-5 sm:px-7 transition-colors"
            >
              {t.name}
            </Link>
            <MaMark className="h-2.5 w-auto text-town-forest shrink-0" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-town-navy to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-town-navy to-transparent" />
    </div>
  );
}
