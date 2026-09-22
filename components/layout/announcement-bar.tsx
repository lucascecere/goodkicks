import Link from 'next/link';
import type { BrandConfig } from '@/lib/brand/brands';

/**
 * The thin promo strip above the header.
 *
 * A scrolling track rather than a single centred line: three standing promises
 * fit where one did, and the movement is what makes the top of the page feel
 * tended rather than static.
 *
 * EVERY LINE MUST BE TRUE. This bar is the first claim a visitor reads and the
 * one they will hold us to at checkout, so it carries only facts the store can
 * honour — the free-shipping threshold is read from the SAME brand field that
 * drives the cart's progress bar, so the two can never drift apart. No invented
 * discount codes, no "limited time", no countdown.
 *
 * The track is its content duplicated EXACTLY once: `.marquee-x` travels -50%,
 * so a third copy or a half copy makes the loop visibly jump.
 */
export function AnnouncementBar({ brand }: { brand: BrandConfig }) {
  const items = brand.announce;
  if (!items || items.length === 0) return null;

  // Repeat the set until the track is long enough to fill a wide viewport
  // before it wraps — three short phrases on a 1440 screen would otherwise
  // leave a visible gap chasing them across the bar.
  const filled = items.length >= 6 ? items : Array(Math.ceil(6 / items.length)).fill(items).flat();

  return (
    <div className="bg-accent text-accent-contrast overflow-hidden">
      <div className="flex w-max marquee-x">
        {/* Duplicated once for the -50% loop. The copy is aria-hidden so a
            screen reader hears the promises once, not twice. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
            {filled.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center gap-8 whitespace-nowrap px-8 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em]"
              >
                {item.href ? (
                  <Link href={item.href} className="underline-offset-4 hover:underline">
                    {item.text}
                  </Link>
                ) : (
                  item.text
                )}
                <span className="opacity-50">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
