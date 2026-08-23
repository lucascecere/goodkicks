import type { Metadata } from 'next';
import Link from 'next/link';
import { SupportForm } from '@/components/forms/support-form';
import { gkCanonical } from '@/lib/seo/site';

// Good Kicks' own support page.
//
// Before this, goodkicks.co/contact 308'd to the TOWNIES /support page — a
// Good Kicks customer with a foot bag question landed on a page about hats.
// Worse, that redirect lives in next.config.ts, which runs before middleware,
// so the host rewrite could never have fixed it.
//
// The form posts through the same /api/contact as every other inquiry; it tags
// itself Good Kicks automatically, because postContact() reads the brand off
// the page it is rendered on rather than hardcoding one.

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Questions about an order, a foot bag, shipping or returns. A real person reads these.',
  alternates: { canonical: gkCanonical('support') },
  openGraph: {
    title: 'Support — Good Kicks',
    description: 'Order questions, foot bag questions, anything else. A real person reads these.',
    url: gkCanonical('support'),
  },
};

export default function Page() {
  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-rust font-medium mb-3">
          Support
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">need a hand?</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          Order gone sideways, a question about the bags, or something we got wrong. This reaches
          a person, not a ticket queue.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 pb-24">
        <SupportForm />

        <div className="mt-14 pt-8 border-t border-brand-rule text-sm text-brand-muted">
          Looking for something else? Read the{' '}
          <Link href="/goodkicks/faq" className="underline underline-offset-4 hover:text-brand-ink">
            FAQ
          </Link>
          , check{' '}
          <Link
            href="/goodkicks/shipping-returns"
            className="underline underline-offset-4 hover:text-brand-ink"
          >
            shipping &amp; returns
          </Link>
          , or ask about the{' '}
          <Link
            href="/goodkicks#ambassadors"
            className="underline underline-offset-4 hover:text-brand-ink"
          >
            ambassador program
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
