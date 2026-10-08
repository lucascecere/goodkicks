import type { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/townies/v2/policy-page';

export const metadata: Metadata = {
  title: 'Returns Policy',
  description: 'Townies returns and exchanges: 30 days on unworn in-stock hats, made-to-order pre-orders are final sale, and damaged or wrong items made right.',
  alternates: { canonical: '/returns-policy' },
};

export default function ReturnsPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Returns policy."
      updated="October 2026"
      related={[
        { href: '/shipping-policy', label: 'Shipping policy' },
        { href: '/privacy', label: 'Privacy & terms' },
        { href: '/support', label: 'Contact support' },
      ]}
      sections={[
        {
          id: 'returns',
          heading: 'Returns and exchanges',
          body: (
            <>
              <p>
                Not the right fit? Unworn, unwashed items with tags can be returned within <strong>30 days</strong> of
                delivery for a refund or exchange.
              </p>
              <p>
                Return shipping is on us if we got something wrong. Otherwise the customer covers return postage.
                Refunds go back to your original payment method once we have the item.
              </p>
            </>
          ),
        },
        {
          id: 'final-sale',
          heading: 'Made-to-order pre-orders',
          body: (
            <p>
              Pre-order hats are embroidered just for you, so they are <strong>final sale</strong> unless they arrive
              damaged or incorrect.
            </p>
          ),
        },
        {
          id: 'damaged',
          heading: 'Damaged or wrong items',
          body: (
            <p>
              If your order arrives damaged, defective or wrong, reach out within <strong>7 days</strong> of delivery
              with a photo and your order number and we&apos;ll make it right.
            </p>
          ),
        },
        {
          id: 'start',
          heading: 'Start a return',
          body: (
            <p>
              Send your order number through the{' '}
              <Link href="/support" className="text-text underline underline-offset-4">support page</Link>. We
              usually answer within 1 to 2 business days.
            </p>
          ),
        },
      ]}
    />
  );
}
