import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { ProductCard } from '@/components/townies/product-card';
import { PageMasthead } from '@/components/townies/page-masthead';
import { breadcrumbSchema } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'South Shore — Shop the Drop',
  description:
    'The first Townies drop: South Shore hats and designs. Massachusetts town-pride apparel, available to pre-order now.',
  alternates: { canonical: '/south-shore' },
};

export default async function SouthShorePage() {
  const all = await getTownieProducts();
  // Prefer products tagged south-shore; fall back to the whole townies collection.
  const southShore = all.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === 'south-shore'),
  );
  const items = southShore.length > 0 ? southShore : all;

  return (
    <div className="bg-town-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'South Shore', path: '/south-shore' },
            ]),
          ),
        }}
      />
      <PageMasthead
        eyebrow="The first drop"
        title="The South Shore."
        sub={`Where it all kicked off. Hats repping the towns we actually know — Milton, Weymouth, Hingham, Braintree. Grab yours before the run's gone.`}
        pattern="ma"
        align="center"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-24">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-town-muted text-sm mb-6">
              The first drop lands soon. Get on the town list and we&apos;ll tell you
              the moment it&apos;s live.
            </p>
            <Link
              href="/#join"
              className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
            >
              Join the town list
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
