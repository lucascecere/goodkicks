import { MaMark, PineMark, SignpostMark, AnchorMark } from '@/components/brand/wordmark';

/**
 * Four-up promise band, drawn with the brand-sheet icon set.
 *
 * Sits between the shopping sections and the closing CTA, where the page used
 * to run to empty cream. Marks rather than photos on purpose — this is the one
 * band that shouldn't be waiting on a photoshoot.
 */
const ITEMS = [
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

export function ValueBand() {
  return (
    <section className="bg-town-cream border-t border-town-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 sm:gap-x-10">
          {ITEMS.map(({ Mark, title, body, markClass }) => (
            <div key={title}>
              <div className="h-14 flex items-end mb-5 text-town-forest">
                <Mark className={markClass} />
              </div>
              <h3 className="font-block uppercase text-town-navy text-xl sm:text-2xl leading-tight mb-2">
                {title}
              </h3>
              <p className="text-town-muted text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
