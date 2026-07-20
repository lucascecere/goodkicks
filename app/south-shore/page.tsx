import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { ProductCard } from '@/components/townies/product-card';
import { BrandPattern } from '@/components/townies/brand-pattern';
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
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
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
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          The first drop
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-7xl text-town-navy mb-4">
          The South Shore.
        </h1>
        <p className="text-town-muted max-w-md mx-auto leading-relaxed">
          Where it all kicked off. Hats repping the towns we actually know — Milton,
          Weymouth, Hingham, Braintree. Grab yours before the run&apos;s gone.
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pb-24">
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
