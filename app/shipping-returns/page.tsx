import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';

export const metadata: Metadata = {
  title: 'Shipping & Returns — Townies',
  description:
    'How Townies ships and handles returns. Town-pride apparel shipped from Massachusetts, with a straightforward returns policy.',
  alternates: { canonical: '/shipping-returns' },
  openGraph: {
    title: 'Shipping & Returns — Townies',
    description: 'Town-pride apparel shipped from Massachusetts. Our shipping & returns policy.',
    url: '/shipping-returns',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shipping & Returns — Townies',
    description: 'Town-pride apparel shipped from Massachusetts. Our shipping & returns policy.',
    images: ['/opengraph-image.png'],
  },
};

export default function ShippingReturnsPage() {
  return (
    <div className="bg-town-cream">
      <div className="relative overflow-hidden">
        <BrandPattern variant="ma" color="forest" opacity={0.06} size={150} fade="b" />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 pt-16 sm:pt-24 pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
            From Massachusetts, to your door
          </p>
          <h1 className="font-block uppercase text-4xl sm:text-6xl text-town-navy mb-3">
            Shipping &amp; Returns
          </h1>
          <p className="text-town-muted">Last updated June 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 sm:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 text-town-navy">
          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Shipping</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>Every Townies order ships from <strong className="text-town-navy">Massachusetts</strong>. Most orders leave our hands within <strong className="text-town-navy">1–3 business days</strong>; new town drops made to order may take a little longer, and we&apos;ll always say so on the product page.</p>
              <p>Standard shipping is a <strong className="text-town-navy">flat rate calculated at checkout</strong>, and orders over <strong className="text-town-navy">$75 ship free</strong>.</p>
              <p>We ship via USPS or UPS depending on order size. Once it&apos;s on the way, domestic orders typically arrive within <strong className="text-town-navy">3–7 business days</strong>, and you&apos;ll get a tracking email the moment it ships.</p>
              <p>We currently ship within the <strong className="text-town-navy">United States only</strong>. International shipping isn&apos;t available yet — check back soon.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Returns &amp; Exchanges</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>Not the right fit? Unworn, unwashed items with tags can be returned within <strong className="text-town-navy">30 days</strong> of delivery for a refund or exchange.</p>
              <p>Return shipping is on us if we got something wrong — otherwise the customer covers return postage. Refunds land on your original payment method once we&apos;ve got the item back.</p>
              <p>Made-to-order town drops are produced just for you, so those are <strong className="text-town-navy">final sale</strong> unless they arrive damaged or incorrect.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Damaged or Wrong Items</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>If your order shows up damaged, defective, or just plain wrong, reach out within <strong className="text-town-navy">7 days</strong> of delivery with a photo and your order number and we&apos;ll make it right — no runaround.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Lost or Stolen Packages</h2>
            <div className="space-y-3 text-town-muted leading-relaxed">
              <p>Once tracking shows a package delivered, we can&apos;t take responsibility for lost or stolen parcels — check with neighbors and your local post office first. If it says delivered and it&apos;s nowhere to be found, get in touch and we&apos;ll do our best to help.</p>
            </div>
          </section>

          <div className="border-t border-town-rule" />

          <section>
            <h2 className="font-block uppercase text-xl sm:text-2xl text-town-navy mb-3">Questions?</h2>
            <p className="text-town-muted leading-relaxed">
              Hit us up on the{' '}
              <Link href="/contact" className="text-town-forest underline underline-offset-4 hover:text-town-navy transition-colors">
                contact page
              </Link>{' '}
              — we typically answer within 1–2 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
