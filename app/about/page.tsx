import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Good Kicks — The Story Behind the Foot Bag',
  description:
    'Two college friends, a quiet renaissance, and one simple bet. How Good Kicks became the foot bag brand built for campus circles.',
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      {/* Hero text */}
      <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-12 leading-tight">
        two college friends. a quiet renaissance. one simple bet.
      </h1>

      {/* Story */}
      <div className="space-y-6 text-brand-muted leading-relaxed">
        <p>
          it started the way most good things do: with a circle. not a brand, not a business — just a group
          of people kicking a little bag around a quad, trying not to let it hit the ground.
        </p>
        <p>
          somewhere in there we realized that the hacky sack was dying — not because people stopped caring,
          but because nobody was doing it right. the good ones were hard to find. the cheap ones fell apart
          in a week. and nobody was talking to the communities keeping it alive.
        </p>
        <p>
          {/* TODO: add real origin story here */}
          so we started Good Kicks. two college friends who genuinely believe the circle is worth keeping going.
        </p>
      </div>

      {/* Image break placeholder */}
      <div className="my-16 aspect-video bg-brand-rule rounded-lg flex items-center justify-center text-brand-muted">
        {/* TODO: replace with real photo */}
        <span className="text-sm">the 25 sacs that started it.</span>
      </div>

      {/* Product section */}
      <div className="space-y-4 text-brand-muted leading-relaxed">
        <h2 className="font-display text-2xl text-brand-ink">the product</h2>
        <p>
          {/* TODO: confirm Global Village Imports manufacturing details */}
          we partnered with Global Village Imports, a co-op that&apos;s been hand-stitching foot bags for over 30 years.
          when you buy a Good Kick, you&apos;re getting the same bag that serious circles have used for decades —
          just with our name on it, and our commitment behind it.
        </p>
      </div>

      {/* Mission */}
      <div className="my-16 text-center space-y-4">
        <p className="text-brand-muted leading-relaxed">
          we&apos;re not trying to be the biggest name in foot bags. we&apos;re trying to be the right one.
          the one that shows up when your campus crew needs a restock. the one that goes in every freshman&apos;s
          care package. the one that keeps the circle going.
        </p>
        <p className="font-display text-4xl sm:text-5xl text-brand-ink mt-8">
          make the circle bigger.
        </p>
        {/* Color block decoration */}
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-8 h-1.5 bg-brand-rust rounded-full" />
          <div className="w-8 h-1.5 bg-brand-blue rounded-full" />
          <div className="w-8 h-1.5 bg-brand-green rounded-full" />
        </div>
      </div>

      {/* CTA band */}
      <div className="rounded-xl bg-brand-rust text-white p-8 text-center space-y-4 mt-12">
        <p className="font-display text-2xl">get one going.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-white text-brand-rust px-6 py-3 rounded font-medium hover:bg-brand-cream transition-colors"
        >
          shop the good kick →
        </Link>
      </div>
    </div>
  );
}
