import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { EditorialSplit } from '@/components/townies/editorial-split';
import { StoryCarousel } from '@/components/townies/story-carousel';
import { BrandPattern } from '@/components/townies/brand-pattern';
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

      <EditorialSplit
        eyebrow="Small towns. Strong roots."
        headline="Your town, on the tag."
        body="We make one thing well: apparel that puts your hometown front and center. The town name is the headline — Townies is just the small label that says it's made right. No loud logos. No state-shape clichés. Just where you're from, worn proud."
        cta={{ href: '/about', label: 'read our story' }}
        imageSrc="/brand/lifestyle/split-foliage.jpg"
        imageAlt="New England autumn foliage"
        imageLabel="Townies"
        tone="forest"
      />

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
        cta={{ href: '/shop', label: 'shop the south shore' }}
        imageSrc="/brand/lifestyle/split-harbor.jpg"
        imageAlt="Scituate Harbor, Massachusetts"
        imageLabel="South Shore"
        reverse
        tone="navy"
      />
    </>
  );
}
