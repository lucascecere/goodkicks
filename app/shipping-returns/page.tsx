import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Returns — Good Kicks',
  description: 'Shipping timelines, return policy, and order info for Good Kicks foot bags.',
  alternates: { canonical: '/shipping-returns' },
  robots: { index: false },
};

export default function ShippingReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <h1 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">shipping & returns.</h1>
      <p className="text-brand-muted mb-12">last updated May 2026</p>

      <div className="space-y-10 text-brand-ink">

        <section>
          <h2 className="font-display text-2xl mb-3">shipping</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>All Good Kicks foot bags are hand-stitched to order. Current processing time is <strong className="text-brand-ink">2–3 weeks</strong> from the date of purchase.</p>
            <p>We ship via USPS First Class or Priority Mail depending on order size. Once shipped, domestic orders typically arrive within 3–7 business days.</p>
            <p>You'll receive a shipping confirmation email with tracking when your order leaves our hands.</p>
            <p>We currently ship within the <strong className="text-brand-ink">United States only</strong>. International shipping is not available at this time — check back soon.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">pre-orders</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>All current orders are pre-orders. Your card is charged at checkout, and your sack ships within the 2–3 week window once it's ready.</p>
            <p>Pre-orders help us stitch exactly what's needed — no waste, no overstock.</p>
          </div>
        </section>

        <div className="border-t border-brand-rule" />

        <section>
          <h2 className="font-display text-2xl mb-3">returns & exchanges</h2>
          <div className="space-y-3 text-brand-muted leading-relaxed">
            <p>Because every sack is hand-stitched to order, <strong className="text-brand-ink">we do not accept returns for change of mind</strong>.</p>
            <p>If your order arrives damaged, defective, or incorrect, email us at <a href="mailto:goodkicksfootbags@gmail.com" className="text-brand-rust underline">goodkicksfootbags@gmail.com</a> within 7 days of delivery with a photo and your order number. We'll make it right.</p>
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
          <p className="text-brand-muted">Email us at <a href="mailto:goodkicksfootbags@gmail.com" className="text-brand-rust underline">goodkicksfootbags@gmail.com</a> — we typically respond within 1–2 business days.</p>
        </section>

      </div>
    </div>
  );
}
