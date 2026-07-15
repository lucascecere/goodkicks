import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { EditorialSplit } from '@/components/townies/editorial-split';
import { DropFeature } from '@/components/townies/drop-feature';
import { CURRENT_DROP } from '@/lib/townies/drops';
import { StoryCarousel } from '@/components/townies/story-carousel';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { ProductCard } from '@/components/townies/product-card';
import { getTownieProducts } from '@/lib/shopify/collections';
import { toTownView, PLACEHOLDER_TOWNS, type TownView } from '@/lib/townies/towns';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Townies — Rep Your Town. Massachusetts Town-Pride Apparel',
  description:
    'Town-pride apparel from Massachusetts, for Massachusetts. The town is the hero. Starting with the South Shore — Scituate, Marshfield, Hingham, Weymouth, Hanover and more.',
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
  const live = products.map(toTownView);
  // Degrade gracefully before the townies collection is populated at cutover.
  const towns: TownView[] = live.length > 0 ? live : PLACEHOLDER_TOWNS;

  // The launch drop: products tagged south-shore (fall back to the whole
  // collection). Empty until the first Townies products exist → section hides.
  const ssTagged = products.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === 'south-shore'),
  );
  const launchItems = (ssTagged.length > 0 ? ssTagged : products).slice(0, 4);

  return (
    <>
      <Hero
        slides={[
          '/brand/lifestyle/hero.jpg',
          '/brand/lifestyle/split-harbor.jpg',
          '/brand/lifestyle/town-scituate.jpg',
          '/brand/lifestyle/town-cohasset.jpg',
        ]}
      />

      {/* First drop — real lifestyle photos of the Milton + Braintree hats. */}
      <DropFeature
        eyebrow="The first drop"
        headline="Milton & Braintree."
        blurb="Heavyweight town hats, embroidered and built to last — repping where you're from. Pre-order now; more towns coming down the line."
        drops={CURRENT_DROP}
        cardHref="/south-shore"
        cta={{ href: '/south-shore', label: 'Shop the drop' }}
      />

      {launchItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-6 sm:-mt-10 pb-4 sm:pb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {launchItems.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-town-cream py-12 sm:py-16">
        <BrandPattern variant="ma" color="forest" opacity={0.1} size={230} fade="y" />
        <div className="relative">
          <StoryCarousel towns={towns} includeOrigin />
        </div>
      </section>

      <EditorialSplit
        eyebrow="The South Shore"
        headline="Started where the tide turns."
        body="Scituate. Marshfield. Hingham. Weymouth. Hanover. The first towns off the line, because these are the streets we know. Each drop is a town done right — heavyweight, well-worn from day one, built to last past the season."
        cta={{ href: '/south-shore', label: 'shop the south shore' }}
        imageSrc="/brand/lifestyle/split-harbor.jpg"
        imageAlt="Scituate Harbor, Massachusetts"
        imageLabel="South Shore"
        reverse
        tone="navy"
      />
    </>
  );
}
