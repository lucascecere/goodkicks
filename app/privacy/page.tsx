import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';

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
          <p className="text-town-muted">Last updated June 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 text-town-navy">
          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">What We Collect</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>When you place an order, we collect your name, email, shipping address, and payment information. Payment is processed securely through Shopify — we never store your card details.</p>
              <p>When you sign up for emails or submit a form on the site, we collect your email address (and phone, if you give it) along with anything else you choose to share.</p>
              <p>We use analytics to understand how visitors use the site — anonymized data like page views, session length, and general location. No personally identifiable information is collected through analytics.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">How We Use It</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>We use your information to fulfill orders, send shipping confirmations, and answer your questions.</p>
              <p>If you opt into our list, we may send you new town drops, restocks, and the occasional members-only offer — by email and text. You can unsubscribe anytime.</p>
              <p>We do not sell, trade, or share your personal information with third parties for their marketing purposes.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Cookies</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>Our site uses cookies to keep your cart active and to support analytics. By using the site you consent to this use. You can disable cookies in your browser settings, though some features may not work correctly.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Terms of Service</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>By using this site you agree to these terms. We reserve the right to refuse service or cancel orders at our discretion.</p>
              <p>All products are sold as described. Colors may vary slightly from screen to screen due to monitor settings.</p>
              <p>Townies Apparel Co. is not liable for any indirect, incidental, or consequential damages arising from use of our products or site.</p>
              <p>These terms are governed by the laws of the Commonwealth of Massachusetts.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Contact</h2>
            <p className="text-town-muted leading-relaxed">
              Questions about privacy or these terms? Reach us on the{' '}
              <Link href="/support" className="text-town-forest underline underline-offset-4 hover:text-town-navy transition-colors">
                contact page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
