import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Terms — Good Kicks',
  description: 'Privacy policy and terms of service for Good Kicks foot bags.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">privacy & terms.</h1>
      <p className="text-brand-muted mb-12">last updated May 2026</p>

      <div className="space-y-10 text-brand-ink">

        <section>
          <h2 className="font-display text-2xl mb-3">what we collect</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>When you place an order, we collect your name, email address, shipping address, and payment information. Payment is processed securely through Shopify — we never store your card details.</p>
            <p>When you sign up for emails, subscribe to our newsletter, or submit a form on the site, we collect your email address and any other information you provide.</p>
            <p>We use Google Analytics to understand how visitors use the site. This collects anonymized data like page views, session duration, and general location. No personally identifiable information is collected through analytics.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">how we use it</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>We use your information to fulfill orders, send shipping confirmations, and communicate about your purchase.</p>
            <p>If you opt into marketing emails, we may send you updates about new products, ambassador program news, and occasional discounts. You can unsubscribe at any time.</p>
            <p>We do not sell, trade, or share your personal information with third parties for their marketing purposes.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">cookies</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>Our site uses cookies to keep your cart active and to support analytics. By using the site you consent to this use. You can disable cookies in your browser settings, though some features may not work correctly.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">terms of service</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>By using goodkicks.co you agree to these terms. We reserve the right to refuse service or cancel orders at our discretion.</p>
            <p>All products are sold as described. Colors may vary slightly from screen to screen due to monitor settings and the hand-stitched nature of our products.</p>
            <p>Good Kicks is not liable for any indirect, incidental, or consequential damages arising from use of our products or site.</p>
            <p>These terms are governed by the laws of the United States.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">contact</h2>
          <p className="text-brand-muted">Questions about privacy or these terms? Email <a href="mailto:goodkicksfootbags@gmail.com" className="text-brand-rust underline">goodkicksfootbags@gmail.com</a>.</p>
        </section>

      </div>
    </div>
  );
}
