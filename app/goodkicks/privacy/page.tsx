import type { Metadata } from 'next';
import { PrivacyContent, PRIVACY_UPDATED } from '@/components/legal/privacy-content';
import { gkCanonical } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms',
  description: 'Privacy policy and terms of service for Good Kicks.',
  alternates: { canonical: gkCanonical('privacy') },
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-6">
        <p className="text-xs uppercase tracking-widest text-brand-rust font-medium mb-3">
          The fine print
        </p>
        <h1 className="font-display text-4xl sm:text-6xl text-brand-ink mb-3">
          privacy &amp; terms.
        </h1>
        <p className="text-brand-muted">Last updated {PRIVACY_UPDATED}</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-28">
        <PrivacyContent supportHref="/goodkicks/support" />
      </div>
    </div>
  );
}
