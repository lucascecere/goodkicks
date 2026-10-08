import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import type { PublicReview } from '@/lib/reviews/server';
import { Stars } from './stars';

/**
 * Reviews for one hat on its product page. Real, approved reviews only
 * (see lib/townies/reviews.ts for the rule). With none yet it shows a quiet
 * "be the first" line rather than an empty box.
 */
export function ProductReviews({ reviews, handle }: { reviews: PublicReview[]; handle: string }) {
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const write = `/review?hat=${encodeURIComponent(handle)}`;

  return (
    <section id="reviews" className="mt-20 scroll-mt-28 sm:mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
        <div>
          <h2 className="display text-2xl text-text sm:text-3xl">Reviews</h2>
          {count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-[0.9375rem] text-text">
              <Stars value={avg} size={16} />
              <span className="font-semibold">{avg.toFixed(1)}</span>
              <span className="text-muted">· {count} {count === 1 ? 'review' : 'reviews'}</span>
            </p>
          )}
        </div>
        <Link href={write} className="font-label border border-text px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-text hover:text-white">
          Write a review
        </Link>
      </div>
      {count === 0 ? (
        <p className="text-[0.9375rem] text-muted">No reviews on this one yet. Own it? <Link href={write} className="text-text underline underline-offset-4">Be the first.</Link></p>
      ) : (
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {reviews.map((r, i) => (
            <li key={i} className="border-b border-rule pb-8 sm:border-0 sm:pb-0">
              <Stars value={r.rating} />
              <p className="mt-3 text-[0.9875rem] leading-relaxed text-text">{r.quote}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted">
                <span className="font-semibold text-text">{r.name}</span>
                {r.town && <span>· {r.town}</span>}
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-[#2F4F3A]">
                    <BadgeCheck size={14} aria-hidden /> Verified order
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
