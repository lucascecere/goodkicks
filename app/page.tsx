import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { EditorialSplit } from '@/components/townies/editorial-split';
import { StoryCarousel } from '@/components/townies/story-carousel';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { getTownieProducts } from '@/lib/shopify/collections';
import { groupByTown, PLACEHOLDER_TOWNS, type TownView } from '@/lib/townies/towns';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Townies — Rep Your Town. Massachusetts Town-Pride Apparel',
  description:
    'Massachusetts town-pride apparel for people who rep where they’re from. Heavyweight hats and tees, one town at a time — Milton, Weymouth, Hingham, Braintree and more. South Shore first.',
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

  return (
    <>
      <Hero
        slides={['/brand/drops/milton.jpg', '/brand/drops/braintree.jpg']}
      />

      <section className="relative overflow-hidden bg-town-cream py-12 sm:py-16">
        <BrandPattern variant="ma" color="forest" opacity={0.1} size={230} fade="y" />
        <div className="relative">
          <StoryCarousel towns={towns} includeOrigin />
        </div>
      </section>

      <EditorialSplit
        eyebrow="Where it started"
        headline="South Shore 'til I die."
        body="Milton. Weymouth. Hingham. Braintree. The towns we actually know — off the line first. These are the streets, the packies, the fields, the exits you'd never let anyone talk down. Every drop is one town done right: heavyweight, worn-in from day one, built to outlast the season. Down here we don't do disposable."
        cta={{ href: '/shop', label: 'shop the towns' }}
        imageSrc="/brand/lifestyle/split-harbor.jpg"
        imageAlt="Scituate Harbor, Massachusetts"
        imageLabel="South Shore"
        reverse
        tone="navy"
      />
    </>
  );
}
