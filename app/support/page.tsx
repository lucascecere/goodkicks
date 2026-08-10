import type { Metadata } from 'next';
import Link from 'next/link';
import { PageMasthead } from '@/components/townies/page-masthead';
import { SupportForm } from '@/components/forms/support-form';

export const metadata: Metadata = {
  title: 'Support — Townies',
  description: 'Questions about an order, sizing, shipping or returns. We answer everything, usually the same day.',
  alternates: { canonical: '/support' },
  openGraph: {
    title: 'Support — Townies',
    description: 'Questions about an order, sizing, shipping or returns. We answer everything, usually the same day.',
    url: '/support',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="bg-town-cream">
      <PageMasthead
        eyebrow="Support"
        title="Need a hand?"
        sub={`Order gone sideways, sizing question, or something we got wrong — this reaches a person, not a ticket queue.`}
        pattern="speckle"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SupportForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          Looking for something else? <Link href="/request-a-town" className="underline underline-offset-4 hover:text-town-navy">Request your town</Link>, ask about <Link href="/wholesale" className="underline underline-offset-4 hover:text-town-navy">wholesale</Link>, or <Link href="/ambassadors" className="underline underline-offset-4 hover:text-town-navy">become an ambassador</Link>.
        </div>
      </div>
    </div>
  );
}
