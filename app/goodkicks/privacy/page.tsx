import type { Metadata } from 'next';
import { PageMasthead } from '@/components/townies/page-masthead';
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
    <div className="bg-bg">
      <PageMasthead eyebrow="The fine print" title="privacy & terms." sub={`Last updated ${PRIVACY_UPDATED}`} pattern="none" />
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <PrivacyContent supportHref="/goodkicks/support" />
      </div>
    </div>
  );
}
