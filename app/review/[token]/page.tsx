import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageMasthead } from '@/components/townies/page-masthead';
import { ReviewForm } from '@/components/townies/review-form';
import { lookupRequest } from '@/lib/reviews/server';

/**
 * The review page reached from the post-delivery email.
 *
 * The token IS the auth — it names the order, so the ask can be specific about
 * which hat, and the review comes out `verified`. A spent or unknown token
 * 404s rather than silently falling back to the open form, so a forwarded link
 * cannot be used to manufacture a verified review.
 */
export const metadata: Metadata = {
  title: 'Leave a review — Townies',
  robots: { index: false, follow: false },
};

export default async function TokenReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const request = await lookupRequest(token);
  if (!request || request.review_id) notFound();

  const first = request.name?.trim()?.split(' ')[0];

  return (
    <>
      <PageMasthead
        eyebrow={first ? `Thanks, ${first}` : 'Your two cents'}
        title="How's it wearing?"
        sub="Thirty seconds, good or bad. We read every one."
        pattern="speckle"
      />
      <section className="bg-bg py-12 sm:py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-8">
          <ReviewForm
            token={token}
            brand={request.brand === 'goodkicks' ? 'goodkicks' : 'townies'}
            productTitle={request.product_title}
          />
        </div>
      </section>
    </>
  );
}
