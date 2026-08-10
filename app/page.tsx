import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/townies/hero';
import { EditorialSplit } from '@/components/townies/editorial-split';
import { StoryCarousel } from '@/components/townies/story-carousel';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { ProductCard } from '@/components/townies/product-card';
import { TownTicker } from '@/components/townies/town-ticker';
import { TaglineBand } from '@/components/townies/tagline-band';
import { ValueBand } from '@/components/townies/value-band';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { getTownieProducts } from '@/lib/shopify/collections';
import { groupByTown, PLACEHOLDER_TOWNS, townKey, type TownView } from '@/lib/townies/towns';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Townies — Rep Your Town. Massachusetts Town-Pride Apparel',
  description:
    'Massachusetts town-pride hats for people who rep where they’re from. Stitched heavy, one town at a time — Milton, Weymouth, Hingham, Braintree and more. South Shore first.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Townies — Rep Your Town.',
    description: 'Massachusetts town-pride apparel. The town is the hero, Townies is the label.',
    url: '/',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default async function HomePage() {
  const products = await getTownieProducts();
  const live = groupByTown(products);
  // Degrade gracefully before the townies collection is populated.
  const towns: TownView[] = live.length > 0 ? live : PLACEHOLDER_TOWNS;

  // Distinct town names for the ticker, in catalogue order.
  const tickerTowns = [...new Set(products.map((p) => townKey(p).name))];

  return (
    <>
      <Hero
        slides={['/brand/drops/milton.jpg', '/brand/drops/braintree.jpg']}
      />

      <TownTicker towns={tickerTowns} />

      {products.length > 0 && (
        <section className="relative bg-town-cream pt-14 sm:pt-20 pb-14 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="flex items-end justify-between gap-4 mb-7 sm:mb-9">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-2">
                  The latest drops
                </p>
                <h2 className="font-block uppercase text-4xl sm:text-6xl text-town-navy leading-[0.9]">
                  Shop the hats.
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex text-sm lowercase tracking-wide text-town-navy underline underline-offset-4 hover:text-town-forest transition-colors whitespace-nowrap"
              >
                see all towns
              </Link>
            </div>
            {/* Eight, not four. One short row read as a teaser of a thin
                catalogue; two rows read as a shop. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.slice(0, 8).map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 2} />
              ))}
            </div>
            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/shop"
                className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em]"
              >
                Shop all towns
              </Link>
            </div>
          </div>
        </section>
      )}

      <TaglineBand />

      <section className="relative overflow-hidden bg-town-cream py-14 sm:py-20">
        <BrandPattern variant="topo" color="navy" opacity={0.07} size={260} fade="y" />
        <div className="relative">
          <StoryCarousel towns={towns} includeOrigin />
        </div>
      </section>

      <EditorialSplit
        eyebrow="Where it started"
        headline="South Shore 'til I die."
        body="Milton. Weymouth. Hingham. Braintree. The towns we actually know — off the line first. These are the streets, the packies, the fields, the exits you'd never let anyone talk down. Every drop is one town done right: stitched heavy, worn-in from day one, built to outlast the season. Down here we don't do disposable."
        cta={{ href: '/shop', label: 'shop the towns' }}
        imageSrc="/brand/lifestyle/hero.jpg"
        imageAlt="Scituate Light on the South Shore of Massachusetts"
        imageLabel="South Shore"
        reverse
        tone="navy"
      />

      <ValueBand />

      <RequestTownBand />
    </>
  );
}
