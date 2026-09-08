import type { ComponentType } from 'react';
import { MaMark, PineMark, SignpostMark, AnchorMark } from '@/components/brand/wordmark';

export type ValueItem = {
  Mark: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  markClass?: string;
};

/**
 * Four-up promise band, drawn with the brand-sheet icon set.
 *
 * Sits between the shopping sections and the closing CTA, where the page used
 * to run to empty cream. Marks rather than photos on purpose — this is the one
 * band that shouldn't be waiting on a photoshoot.
 */
const TOWNIES_ITEMS: ValueItem[] = [
  {
    Mark: MaMark,
    title: 'Massachusetts first',
    body: 'Every design starts with a real town — not a state outline with a name dropped on it.',
    // The MA silhouette is wide and short; the rest are tall. Sized apart so
    // they sit on one optical line instead of one literal one.
    markClass: 'h-8 w-auto',
  },
  {
    Mark: SignpostMark,
    title: 'One town at a time',
    body: 'We do a town properly, then move to the next. No 300-SKU dropdown of places we’ve never been.',
    markClass: 'h-14 w-auto',
  },
  {
    Mark: PineMark,
    title: 'Stitched heavy',
    body: 'Structured cotton twill, dense embroidery, a brim that holds its shape past one season.',
    markClass: 'h-14 w-auto',
  },
  {
    Mark: AnchorMark,
    title: 'Shipped from here',
    body: 'Packed and posted on the South Shore. Free shipping over $75, straightforward returns.',
    markClass: 'h-14 w-auto',
  },
];

/**
 * `tone` exists because this band is shared: the product page wants it quiet on
 * cream under a buy box, and the homepage closes on it in full forest green.
 * An explicit prop rather than a className override — `cn` in lib/utils is a
 * naive join, so a passed background would emit alongside this one and leave
 * stylesheet order to pick the winner.
 *
 * Flat colour, no pattern overlay on either tone.
 */
export function ValueBand({
  tone = 'cream',
  items = TOWNIES_ITEMS,
}: {
  /** 'forest' = the brand's full-colour band (forest for Townies, slate for GK). */
  tone?: 'cream' | 'forest';
  items?: ValueItem[];
}) {
  const forest = tone === 'forest';

  return (
    <section className={forest ? 'bg-band' : 'bg-bg border-t border-rule'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-10">
          {items.map(({ Mark, title, body, markClass = 'h-14 w-auto' }) => (
            <div key={title}>
              <div className={`h-14 flex items-end mb-5 ${forest ? 'text-white/85' : 'text-accent'}`}>
                <Mark className={markClass} />
              </div>
              <h3
                className={`heading text-base leading-snug mb-2 ${
                  forest ? 'text-white' : 'text-text'
                }`}
              >
                {title}
              </h3>
              <p
                className={`text-[0.8125rem] leading-relaxed ${
                  forest ? 'text-white/90' : 'text-muted'
                }`}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
