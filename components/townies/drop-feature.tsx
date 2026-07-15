import Link from 'next/link';
import Image from 'next/image';
import { BrandPattern } from './brand-pattern';
import type { Drop } from '@/lib/townies/drops';

// Launch feature: the current drop as big lifestyle cards with the town name
// overlaid + a "Pre-order" tag. Used on the homepage (cards link to the shop)
// and as the /south-shore preview (no card link — just the visual).
export function DropFeature({
  eyebrow,
  headline,
  blurb,
  drops,
  cardHref,
  cta,
}: {
  eyebrow?: string;
  headline?: string;
  blurb?: string;
  drops: Drop[];
  cardHref?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <section className="relative overflow-hidden bg-town-cream py-16 sm:py-24">
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="y" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
        {(eyebrow || headline || blurb) && (
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
                {eyebrow}
              </p>
            )}
            {headline && (
              <h2 className="font-block uppercase text-4xl sm:text-6xl text-town-navy mb-4">
                {headline}
              </h2>
            )}
            {blurb && <p className="text-town-muted leading-relaxed">{blurb}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
          {drops.map((d, i) => {
            const inner = (
              <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-town-navy">
                <Image
                  src={d.image}
                  alt={d.alt}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-town-navy/70 via-town-navy/5 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex items-end justify-between">
                  <div>
                    <p className="text-town-cream/80 text-[0.65rem] uppercase tracking-[0.2em] mb-1">
                      Pre-order
                    </p>
                    <h3 className="font-block uppercase text-white text-4xl sm:text-5xl leading-none">
                      {d.town}
                    </h3>
                  </div>
                  {cardHref && (
                    <span className="text-white/90 text-xs uppercase tracking-[0.18em] underline-offset-4 group-hover:underline pb-1">
                      shop →
                    </span>
                  )}
                </div>
              </div>
            );
            return cardHref ? (
              <Link key={d.town} href={cardHref} className="group block">
                {inner}
              </Link>
            ) : (
              <div key={d.town} className="group block">
                {inner}
              </div>
            );
          })}
        </div>

        {cta && (
          <div className="text-center mt-10 sm:mt-12">
            <Link
              href={cta.href}
              className="inline-flex items-center bg-town-navy text-town-cream px-8 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
            >
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
