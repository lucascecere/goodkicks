import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { productsInRegion } from '@/lib/townies/towns';
import { ProductCard } from '@/components/townies/product-card';
import { PageMasthead } from '@/components/townies/page-masthead';
import { breadcrumbSchema } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Southeastern Mass — Town Hats',
  description:
    'Southeastern Massachusetts town-pride hats from Townies — Norton up first, with Mansfield, Foxboro, and Attleboro on deck. Pre-order now.',
  alternates: { canonical: '/south-east' },
};

export default async function SouthEastPage() {
  const items = productsInRegion(await getTownieProducts(), 'south-east');

  return (
    <div className="bg-town-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Southeastern Mass', path: '/south-east' },
            ]),
          ),
        }}
      />
      <PageMasthead
        eyebrow="Down the map"
        title="Southeastern Mass."
        sub={`The part of the map everyone forgets — we didn't. Norton's up first, with Mansfield, Foxboro, and Attleboro on deck. Down 24 and 495, this one's for you.`}
        pattern="topo"
        align="center"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-24">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-town-muted text-sm mb-6">
              More Southeastern Mass towns are coming. Tell us which one you want and
              we&apos;ll put it in the queue.
            </p>
            <Link
              href="/request-a-town"
              className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
            >
              Request your town
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
