import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/townies/v2/policy-page';
import { TOWNIES } from '@/lib/brand/brands';

const FREE_OVER = `$${(TOWNIES.freeShippingCents ?? 7500) / 100}`;

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: `How Townies ships: from Massachusetts, US only, free over ${FREE_OVER}. In-stock hats leave in 1 to 3 business days; pre-orders are made to order.`,
  alternates: { canonical: '/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Shipping policy."
      updated="October 2026"
      related={[
        { href: '/returns-policy', label: 'Returns policy' },
        { href: '/privacy', label: 'Privacy & terms' },
        { href: '/support', label: 'Contact support' },
      ]}
      sections={[
        {
          id: 'where',
          heading: 'Where we ship',
          body: (
            <p>
              Every Townies order ships from <strong>Massachusetts</strong>. We ship within the{' '}
              <strong>United States only</strong> for now.
            </p>
          ),
        },
        {
          id: 'cost',
          heading: 'Shipping cost',
          body: (
            <p>
              One in-stock hat ships for <strong>$5.95</strong> (a few dollars more for several), and pre-orders ship for a
              flat <strong>$5</strong>. Orders over <strong>{FREE_OVER} ship free</strong>, and so does the Hat &amp; Sack bundle.
            </p>
          ),
        },
        {
          id: 'in-stock',
          heading: 'In-stock hats',
          body: (
            <>
              <p>
                Hats marked <strong>In stock</strong> leave our hands within <strong>1 to 3 business days</strong>.
              </p>
              <p>
                We ship with USPS or UPS depending on the order. Most domestic orders arrive within{' '}
                <strong>3 to 7 business days</strong> of shipping, and you get a tracking email the moment it ships.
              </p>
            </>
          ),
        },
        {
          id: 'pre-order',
          heading: 'Pre-order hats',
          body: (
            <>
              <p>
                Hats marked <strong>Pre-order</strong> are embroidered to order and ship in{' '}
                <strong>2 to 4 weeks</strong> from the day you order, depending on whether we have the blanks on
                hand. Each hat&apos;s page shows its own time, and your cart shows it again before you pay.
              </p>
              <p>You get a tracking email as soon as your pre-order ships.</p>
            </>
          ),
        },
        {
          id: 'lost',
          heading: 'Lost or stolen packages',
          body: (
            <p>
              Once tracking shows a package delivered, we can&apos;t take responsibility for lost or stolen parcels.
              Check with neighbors and your local post office first. If it still hasn&apos;t turned up,{' '}
              <Link href="/support" className="text-text underline underline-offset-4">get in touch</Link> and
              we&apos;ll do our best to help.
            </p>
          ),
        },
        {
          id: 'damaged',
          heading: 'Damaged or wrong items',
          body: (
            <p>
              See our <Link href="/returns-policy#damaged" className="text-text underline underline-offset-4">returns policy</Link>.
              Reach out within 7 days of delivery and we&apos;ll make it right.
            </p>
          ),
        },
      ]}
    />
  );
}
