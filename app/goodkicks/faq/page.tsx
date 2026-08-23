import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQ } from '@/components/home/faq';
import { gkCanonical } from '@/lib/seo/site';

// The FAQ already existed as a section of the Good Kicks homepage, carrying its
// own FAQPage JSON-LD. Promoting it to a real page gives that structured data a
// URL Google can rank on its own, and gives goodkicks.co somewhere to link when
// the answer is "read the FAQ" — which the support page now does.
//
// The component is reused rather than copied, so the two never drift.

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'What a foot bag is, why it is not called a hacky sack, how long one lasts, and how bulk orders work.',
  alternates: { canonical: gkCanonical('faq') },
  openGraph: {
    title: 'FAQ — Good Kicks',
    description: 'Foot bags, hacky sacks, and everything people actually ask us.',
    url: gkCanonical('faq'),
  },
};

export default function Page() {
  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-rust font-medium mb-3">
          Questions
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">
          the usual questions.
        </h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          Everything people ask before their first bag — and a few things they ask after.
        </p>
      </div>

      <FAQ />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 pb-24 text-sm text-brand-muted text-center">
        Still stuck?{' '}
        <Link
          href="/goodkicks/support"
          className="underline underline-offset-4 hover:text-brand-ink"
        >
          Ask us directly
        </Link>
        .
      </div>
    </div>
  );
}
