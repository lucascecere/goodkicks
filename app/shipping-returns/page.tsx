import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Returns — Good Kicks',
  description: '$4 flat rate shipping on all orders. Free shipping on orders $35+. Made-to-order foot bags ship in 1–2 weeks. Read our full shipping and returns policy.',
  alternates: { canonical: '/shipping-returns' },
  openGraph: {
    title: 'Shipping & Returns — Good Kicks',
    description: '$4 flat rate shipping. Free on orders $35+. Ships in 1–2 weeks.',
    url: '/shipping-returns',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shipping & Returns — Good Kicks',
    description: '$4 flat rate shipping. Free on orders $35+. Ships in 1–2 weeks.',
    images: ['/opengraph-image.png'],
  },
};

export default function ShippingReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-8 py-16 sm:py-24">
      <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">shipping & returns.</h1>
      <p className="text-brand-muted mb-12">last updated May 2026</p>

      <div className="space-y-10 text-brand-ink">

        <section>
          <h2 className="font-display text-2xl mb-3">shipping</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>All Good Kicks foot bags are made to order. Current processing time is <strong className="text-brand-ink">1–2 weeks</strong> from the date of purchase.</p>
            <p>Shipping is <strong className="text-brand-ink">$4 flat rate</strong> on all orders. Orders over <strong className="text-brand-ink">$35 ship free</strong>.</p>
            <p>We ship via USPS First Class or Priority Mail depending on order size. Once shipped, domestic orders typically arrive within 3–7 business days.</p>
            <p>You'll receive a shipping confirmation email with tracking when your order leaves our hands.</p>
            <p>We currently ship within the <strong className="text-brand-ink">United States only</strong>. International shipping is not available at this time — check back soon.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">returns & exchanges</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>Because every sack is made to order, <strong className="text-brand-ink">we do not accept returns for change of mind</strong>.</p>
            <p>If your order arrives damaged, defective, or incorrect, email us at <a href="mailto:info@goodkicks.co" className="text-brand-rust underline">info@goodkicks.co</a> within 7 days of delivery with a photo and your order number. We'll make it right.</p>
            <p>Exchanges are handled case by case — reach out and we'll do our best.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">lost or stolen packages</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>Once a package is marked delivered by USPS, we are not responsible for lost or stolen parcels. We recommend checking with neighbors or your local post office first.</p>
            <p>If your tracking shows delivered but you haven't received your order, contact us and we'll do our best to help.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">questions?</h2>
          <p className="text-brand-muted">Email us at <a href="mailto:info@goodkicks.co" className="text-brand-rust underline">info@goodkicks.co</a> — we typically respond within 1–2 business days.</p>
        </section>

      </div>
    </div>
  );
}
