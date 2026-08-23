import type { Metadata } from 'next';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { PrivacyContent, PRIVACY_UPDATED } from '@/components/legal/privacy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms — Townies',
  description: 'Privacy policy and terms of service for Townies Apparel Co.',
  alternates: { canonical: '/privacy' },
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <div className="bg-town-cream">
      <div className="relative overflow-hidden">
        <BrandPattern variant="ma" color="forest" opacity={0.06} size={150} fade="b" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
            The fine print
          </p>
          <h1 className="font-block uppercase text-4xl sm:text-6xl text-town-navy mb-3">
            Privacy &amp; Terms
          </h1>
          <p className="text-town-muted">Last updated {PRIVACY_UPDATED}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-28">
        <PrivacyContent supportHref="/support" />
      </div>
    </div>
  );
}
