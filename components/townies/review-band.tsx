import { Star } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { REVIEWS, type Review } from '@/lib/townies/reviews';
import { getApprovedReviews } from '@/lib/reviews/server';
import { cn } from '@/lib/utils';

/**
 * What customers said, in threes.
 *
 * RENDERS NOTHING WHEN THERE ARE NO REVIEWS, and that is the feature. An empty
 * homepage section beats an invented one, and a star rating is a claim the
 * store has to stand behind. See the rule at the top of lib/townies/reviews.ts.
 *
 * Reads APPROVED reviews out of the database (customers write them at /review,
 * they are moderated at /admin/reviews), and appends anything in the manual
 * REVIEWS list. Both paths are real customers' own words.
 */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          aria-hidden
          className={cn(n <= rating ? 'fill-accent text-accent' : 'fill-none text-rule')}
        />
      ))}
    </div>
  );
}

export async function ReviewBand({
  reviews,
  brand = 'townies',
  eyebrow = 'From the customers',
  title = 'What people say.',
  max = 3,
}: {
  /** Override the database read entirely — used by tests and one-off pages. */
  reviews?: Review[];
  brand?: 'townies' | 'goodkicks';
  eyebrow?: string;
  title?: string;
  max?: number;
}) {
  const approved = reviews ?? [...(await getApprovedReviews(brand)), ...REVIEWS];
  if (approved.length === 0) return null;

  return (
    <section className="bg-bg border-t border-rule py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <SectionHeader eyebrow={eyebrow} title={title} align="center" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approved.slice(0, max).map((r, i) => (
            <figure
              key={`${r.name}-${i}`}
              className="flex flex-col border border-rule bg-surface p-6"
            >
              <Stars rating={r.rating} />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-text">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-5 border-t border-rule pt-4">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
                  {r.name}
                </p>
                {/* Town and hat on one muted line — the interesting part of a
                    Townies review is which town it came from. */}
                {(r.town || r.product) && (
                  <p className="mt-1 text-xs text-muted">
                    {[r.town, r.product].filter(Boolean).join(' · ')}
                  </p>
                )}
                {/* Shown ONLY where the order behind it was matched in Shopify. */}
                {r.verified && (
                  <p className="mt-1.5 text-[0.625rem] uppercase tracking-[0.16em] text-accent">
                    Verified order
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
