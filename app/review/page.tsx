import type { Metadata } from 'next';
import { PageMasthead } from '@/components/townies/page-masthead';
import { ReviewForm } from '@/components/townies/review-form';
import { getTownieProducts } from '@/lib/shopify/collections';

/**
 * The open review page — no order behind it.
 *
 * This is the link to hand to somebody directly: the friends who got the first
 * hats, a customer who emails in, anyone who already owns one. Reviews from
 * here are real but NOT `verified`, because there is no order to tie them to,
 * so they never carry the "Verified order" badge. The tokenised
 * /review/<token> link from the post-delivery email is the one that does.
 */
export const metadata: Metadata = {
  title: 'Leave a review | Townies',
  description: 'Got a Townies hat? Tell us what you think.',
  // Nothing to gain from ranking this, and a review form in search results
  // collects noise from people who never bought anything.
  robots: { index: false, follow: false },
};

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ hat?: string }> }) {
  const { hat } = await searchParams;
  const hats = (await getTownieProducts().catch(() => [])).map((p) => ({ handle: p.handle, title: p.title }));
  return (
    <>
      <PageMasthead
        eyebrow="Your two cents"
        title="How's the hat?"
        sub="Good or bad, tell us. We read every one before it goes on the site."
        pattern="speckle"
      />
      <section className="bg-bg py-12 sm:py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-8">
          <ReviewForm hats={hats} defaultHat={hat} />
        </div>
      </section>
    </>
  );
}
