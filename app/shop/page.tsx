import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { hatStyle, regionForProduct, regionLabel, townKey } from '@/lib/townies/towns';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { breadcrumbSchema } from '@/lib/seo/site';
import { ShopFilter, type RegionTab, type ShopItem, type TownTab } from '@/components/townies/shop-filter';
import { HAT_SACK_LIVE, HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';
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
      {/* v2 (2026-10): a Melin-style collection head, light and left-aligned,
          straight into the filters. The navy band, ticker and pattern are gone. */}
      <section className="border-b border-rule bg-[#F1EEE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60 mb-3">
            The shop
          </p>
          <h1 className="display text-[2.5rem] sm:text-[3.25rem] text-text">Every town.</h1>
          <p className="mt-3 max-w-lg text-text/75 leading-relaxed">
            {items.length > 0
              ? `${items.length} ${items.length === 1 ? 'hat' : 'hats'} across ${towns.length} ${towns.length === 1 ? 'town' : 'towns'}. Filter by region, town or style.`
              : 'The first drop lands soon.'}
          </p>
          {hatSack !== null && (
            <Link
              href={HAT_SACK_PATH}
              className="mt-5 inline-block text-[0.875rem] underline underline-offset-4 text-text/80 hover:text-text"
            >
              Hat &amp; Sack: any hat plus a Good Kicks foot bag, from {formatUsd(hatSack)} shipped
            </Link>
          )}
        </div>
      </section>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-20">
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
            ratings={await getReviewSummaries()}
            items={items}
            towns={towns}
            regions={regions}
            initialTown={town}
            initialRegion={region}
            initialStyle={style}
          />
        )}
      </div>

      <RequestTownBand />
    </div>
  );
}
