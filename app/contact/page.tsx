import type { Metadata } from 'next';
import { ContactForms } from './contact-forms';
import { BrandPattern } from '@/components/townies/brand-pattern';

export const metadata: Metadata = {
  title: 'Contact Townies — Request a Town, Wholesale & Questions',
  description:
    'Get in touch with Townies. Request your hometown, ask about wholesale for your shop, or just say hi — we answer everything.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Townies',
    description: 'Request your town, wholesale, or just questions — we answer everything.',
    url: '/contact',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={160} fade="b" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Holler at us
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-6xl text-town-navy mb-10">
          Get in touch.
        </h1>
        <ContactForms />
      </div>
    </div>
  );
}
