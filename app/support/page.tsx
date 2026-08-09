import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';
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
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={160} fade="b" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Support
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-6xl text-town-navy mb-4">
          Need a hand?
        </h1>
        <p className="text-town-muted leading-relaxed mb-10 max-w-xl">
          Order gone sideways, sizing question, or something we got wrong — this reaches a person, not a ticket queue.
        </p>

        <SupportForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          Looking for something else? <Link href="/request-a-town" className="underline underline-offset-4 hover:text-town-navy">Request your town</Link>, ask about <Link href="/wholesale" className="underline underline-offset-4 hover:text-town-navy">wholesale</Link>, or <Link href="/ambassadors" className="underline underline-offset-4 hover:text-town-navy">become an ambassador</Link>.
        </div>
      </div>
    </div>
  );
}
