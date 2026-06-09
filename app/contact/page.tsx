import type { Metadata } from 'next';
import { ContactForms } from './contact-forms';

export const metadata: Metadata = {
  title: 'Contact Good Kicks — Bulk Orders, Questions & Partnerships',
  description:
    'Get in touch with Good Kicks. Campus bulk orders, sack accounts, partnerships, or just questions about foot bags and hacky sacks — we answer everything.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Good Kicks',
    description: 'Campus bulk orders, partnerships, or just questions — we answer everything.',
    url: '/contact',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Good Kicks',
    description: 'Bulk orders, partnerships, or just questions — we answer everything.',
    images: ['/opengraph-image.png'],
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-12">get in touch.</h1>
      <ContactForms />
    </div>
  );
}
