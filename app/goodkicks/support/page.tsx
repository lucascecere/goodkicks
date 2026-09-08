import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { SupportForm } from '@/components/forms/support-form';
import { gkCanonical } from '@/lib/seo/site';

// Good Kicks' own support page — a foot-bag customer should never land on a
// page about hats. The form posts through the same /api/contact as every other
// inquiry and tags itself Good Kicks from the page it is rendered on.
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
    <div className="bg-bg">
      <PageMasthead
        eyebrow="Support"
        title="need a hand?"
        sub="Order gone sideways, a question about the bags, or something we got wrong. This reaches a person, not a ticket queue."
        pattern="none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SupportForm />

        <div className="mt-14 pt-8 border-t border-rule text-sm text-muted">
          Looking for something else? Read the{' '}
          <Link href="/goodkicks#faq" className="underline underline-offset-4 hover:text-text">FAQ</Link>, check{' '}
          <Link href="/goodkicks/shipping-returns" className="underline underline-offset-4 hover:text-text">shipping &amp; returns</Link>, or ask about the{' '}
          <Link href="/goodkicks#ambassadors" className="underline underline-offset-4 hover:text-text">ambassador program</Link>.
        </div>
      </div>
    </div>
  );
}
