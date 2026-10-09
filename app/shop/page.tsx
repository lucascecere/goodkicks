import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { hatStyle, regionForProduct, regionLabel, townKey } from '@/lib/townies/towns';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { breadcrumbSchema } from '@/lib/seo/site';
import { ShopFilter, type RegionTab, type ShopItem, type TownTab } from '@/components/townies/shop-filter';
import { HAT_SACK_LIVE } from '@/lib/townies/hat-sack';
import { HatSackCard } from '@/components/townies/v2/hat-sack-card';
import { getHatSackFromCents } from '@/lib/shopify/hat-sack-offer';
import { getReviewSummaries } from '@/lib/reviews/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shop Massachusetts Town Hats',
  description:
    'Every Townies hat in one place. Embroidered snapbacks for Massachusetts towns, filterable by town: Milton, Weymouth, Hingham, Braintree and more.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop Massachusetts Town Hats',
    description: 'Embroidered snapbacks for Massachusetts towns. Filter by your town.',
    url: '/shop',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ town?: string; region?: string; style?: string }>;
}) {
  const { town, region, style } = await searchParams;
  const [products, hatSack] = await Promise.all([
    getTownieProducts(),
    HAT_SACK_LIVE ? getHatSackFromCents() : null,
  ]);

  const items: ShopItem[] = products.map((p) => {
    const { slug, name } = townKey(p);
    return { product: p, slug, name, region: regionForProduct(p.tags, slug), style: hatStyle(p.title) };
  });

  // Distinct towns → tabs, alphabetical, each carrying its region so the town
  // row can narrow to the region row's pick.
  const townMap = new Map<string, TownTab>();
  for (const i of items) townMap.set(i.slug, { slug: i.slug, name: i.name, region: i.region });
  const towns: TownTab[] = [...townMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const regionMap = new Map<string, RegionTab>();
  for (const t of towns) regionMap.set(t.region, { slug: t.region, label: regionLabel(t.region) });
  const regions: RegionTab[] = [...regionMap.values()].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="relative overflow-hidden bg-bg">
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


      <div id="hats" className="relative max-w-7xl mx-auto scroll-mt-24 px-4 sm:px-8 pt-8 sm:pt-12 pb-20">
        {/* No section up top (Lucas, 10-09): one quiet title line, then the cards. */}
        <h1 className="mb-6 font-label text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text/60">
          Shop all hats{items.length > 0 ? ` · ${items.length}` : ''}
        </h1>
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted text-sm mb-6">
              The first drop lands soon. Tell us which town you want and we&apos;ll
              put it in the queue.
            </p>
            <Link
              href="/request-a-town"
              className="inline-flex items-center bg-accent text-accent-contrast px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-accent/90 transition-colors"
            >
              Request your town
            </Link>
          </div>
        ) : (
          <ShopFilter
            // Remount when the URL filters change (the hero's region links),
            // since the filter only reads them as its starting state.
            key={`${town ?? ''}|${region ?? ''}|${style ?? ''}`}
            ratings={await getReviewSummaries()}
            items={items}
            towns={towns}
            regions={regions}
            initialTown={town}
            initialRegion={region}
            initialStyle={style}
            promo={hatSack !== null ? <HatSackCard fromCents={hatSack} /> : undefined}
          />
        )}
      </div>

      <RequestTownBand />
    </div>
  );
}
