import type { Metadata } from 'next';
import Link from 'next/link';
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
        <BrandPattern variant="ma" color="forest" opacity={0.06} size={230} fade="y" />
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

      {/* Request-your-town closing band */}
      <section className="relative overflow-hidden bg-town-navy text-white">
        <BrandPattern variant="ma" color="cream" opacity={0.08} size={150} fade="radial" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-town-cream/60 mb-4">
            Don&apos;t see your town?
          </p>
          <h2 className="font-block uppercase text-4xl sm:text-5xl mb-5">
            We&apos;ll make it.
          </h2>
          <p className="text-town-cream/70 max-w-md mx-auto mb-8 leading-relaxed">
            Tell us where you&apos;re from. Enough requests and your town joins the lineup —
            from Massachusetts, for Massachusetts.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center bg-town-cream text-town-navy px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            Request your town
          </Link>
        </div>
      </section>
    </>
  );
}
