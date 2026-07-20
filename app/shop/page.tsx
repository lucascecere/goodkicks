import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { breadcrumbSchema } from '@/lib/seo/site';
import { ShopFilter, type ShopItem, type TownTab } from '@/components/townies/shop-filter';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shop — Townies',
  description:
    'Every town, one place. Massachusetts town-pride apparel — filter by your town. Milton, Weymouth, Hingham, Braintree and more.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop — Townies',
    description: 'Massachusetts town-pride apparel. Filter by your town.',
    url: '/shop',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ town?: string }>;
}) {
  const { town } = await searchParams;
  const products = await getTownieProducts();

  const items: ShopItem[] = products.map((p) => {
    const { slug, name } = townKey(p);
    return { product: p, slug, name };
  });

  // Distinct towns → tabs, alphabetical.
  const townMap = new Map<string, string>();
  for (const i of items) townMap.set(i.slug, i.name);
  const towns: TownTab[] = [...townMap.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
            ]),
          ),
        }}
      />
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          The shop
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-7xl text-town-navy mb-4">
          Every town.
        </h1>
        <p className="text-town-muted max-w-md mx-auto leading-relaxed">
          Every drop, one place. Find yours and rep it. Don&apos;t see your town?
          It&apos;s coming — or tell us to hurry up.
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
          <ShopFilter items={items} towns={towns} initialTown={town} />
        )}
      </div>
    </div>
  );
}
