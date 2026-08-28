import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { TownTickerLinked } from '@/components/townies/town-ticker';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { breadcrumbSchema } from '@/lib/seo/site';
import { ShopFilter, type ShopItem, type TownTab } from '@/components/townies/shop-filter';
import { HAT_SACK_LIVE, HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';

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
  const [products, hatSack] = await Promise.all([
    getTownieProducts(),
    HAT_SACK_LIVE ? getHatSackOffer() : null,
  ]);

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
    <div className="relative overflow-hidden bg-town-cream">
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
      {/* Masthead. A dark band gives the shop a top edge and a place for the
          catalogue counts; the page used to open with centred text floating on
          cream, which read as an unfinished page rather than a shop front. */}
      <section className="relative overflow-hidden bg-town-navy">
        <BrandPattern variant="topo" color="cream" opacity={0.09} size={260} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-3">
            The shop
          </p>
          <h1 className="font-block font-bold uppercase text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-[0.01em] text-white mb-4">
            Every town.
          </h1>
          <p className="text-town-cream/80 max-w-md mx-auto leading-relaxed">
            Every drop, one place. Find yours and rep it. Don&apos;t see your town?
            It&apos;s coming — or tell us to hurry up.
          </p>
          {items.length > 0 && (
            <p className="mt-7 text-[0.68rem] uppercase tracking-[0.22em] text-town-cream/55">
              {items.length} {items.length === 1 ? 'design' : 'designs'}
              <span className="mx-3 text-town-cream/30">·</span>
              {towns.length} {towns.length === 1 ? 'town' : 'towns'}
            </p>
          )}
          {/* The bundle applies to every hat below, so it belongs in the
              masthead rather than as a card competing inside the grid. */}
          {hatSack && (
          <Link
            href={HAT_SACK_PATH}
            className="mt-6 inline-block text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/85 hover:text-white transition-colors"
          >
            Hat &amp; Sack — a town hat + a Good Kicks foot bag, {formatUsd(hatSack.priceCents)}
          </Link>
          )}
        </div>
      </section>

      <TownTickerLinked towns={towns} />

      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-20">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-town-muted text-sm mb-6">
              The first drop lands soon. Tell us which town you want and we&apos;ll
              put it in the queue.
            </p>
            <Link
              href="/request-a-town"
              className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
            >
              Request your town
            </Link>
          </div>
        ) : (
          <ShopFilter items={items} towns={towns} initialTown={town} />
        )}
      </div>

      <RequestTownBand />
    </div>
  );
}
