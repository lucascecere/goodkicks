import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { FeaturedRail } from '@/components/townies/featured-rail';
import { TownTicker } from '@/components/townies/town-ticker';
import { ValueBand } from '@/components/townies/value-band';
import { BulkOrderBand } from '@/components/townies/bulk-order-band';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';

export const revalidate = 60;

/**
 * The hero rotation. Each slide is a campaign — its own photograph, its own
 * line, its own link — rather than a backdrop swap behind fixed copy.
 *
 * These are the three distinct scenes Townies owns: the clover shoot and the
 * two town drop shoots. They used to be split across the hero and two campaign
 * bands, which meant Milton and Braintree each appeared twice in the first two
 * screens. Consolidating them here is why the bands are gone — a carousel
 * cannot manufacture variety the photography doesn't have, it can only re-show
 * the same pictures further down the page.
 *
 * Add a slide per shoot as the shot list lands.
 */
const HERO_SLIDES = [
  {
    imageSrc: '/brand/scene/clover-hero-16x10.jpg',
    mobileSrc: '/brand/scene/clover-hero-1x1.jpg',
    imageAlt: 'Milton, Walpole and West Roxbury Townies snapbacks in a bed of clover',
    eyebrow: 'Massachusetts · one town at a time',
    headline: 'Rep your town.',
    sub: 'Hats for people who’d defend their exit off the expressway. Stitched heavy, one town at a time.',
    cta: { href: '/shop', label: 'Shop all towns' },
  },
  {
    imageSrc: '/brand/scene/milton-hero-16x10.jpg',
    mobileSrc: '/brand/drops/milton.jpg',
    imageAlt: 'Two Milton Townies snapbacks on a curb in Milton Village',
    eyebrow: 'The first town',
    headline: 'Milton. 1640.',
    sub: 'Where this started, and still the one we get asked for most.',
    cta: { href: '/shop?town=milton', label: 'Shop Milton' },
  },
  {
    imageSrc: '/brand/scene/braintree-hero-16x10.jpg',
    mobileSrc: '/brand/drops/braintree.jpg',
    imageAlt: 'Braintree Townies snapbacks on a sidewalk outside Braintree Books',
    eyebrow: 'Now shipping',
    headline: 'Braintree.',
    sub: 'Stitched heavy, worn in from day one.',
    cta: { href: '/shop?town=braintree', label: 'Shop Braintree' },
  },
];

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

/**
 * Photograph, thin band, photograph, rail, quiet, close.
 *
 * The old page ran hero → ticker → product grid → duotone band → town carousel
 * → editorial split → value band → CTA, and rendered 9,174px tall at 1440. Most
 * of that was type: a 128px hero headline and 60px section headings stacked in
 * full-viewport sections. Now every photographic slot holds a real photograph,
 * every headline sits on the shared ramp, and the two sections that were never
 * going to have photography (the bulk push, the value marks) say so with type
 * and flat colour instead of a stock picture standing in for one.
 *
 * Grounds run white → cream → forest → navy footer, so no two neighbouring
 * sections share one and nothing needs a pattern overlay to separate it.
 *
 * Bulk is the growth bet and gets the push, but RequestTownBand still closes
 * /shop — somebody there has just been through the whole catalogue without
 * finding their town, which is a different question from how you buy thirty.
 *
 * The script signature now appears on the homepage only in the wordmark itself.
 * TaglineBand carried it, and once its photograph was pulled it was a tall navy
 * field holding two lines of type. The component still exists and still works;
 * it wants a real photograph behind it before it earns a slot back.
 *
 * CampaignBand is likewise still in the tree and unused here — the three scenes
 * it showed now rotate through the hero instead. It is the right component for
 * a region or collection page, which is where it goes next.
 */
export default async function HomePage() {
  const products = await getTownieProducts();
  const tickerTowns = [...new Set(products.map((p) => townKey(p).name))];

  return (
    <>
      <Hero slides={HERO_SLIDES} />

      <TownTicker towns={tickerTowns} />

      <FeaturedRail products={products} />

      <BulkOrderBand />

      {/* Closes on forest. The four marks were the quietest thing on the page
          sitting on cream in the middle of it; as the last section, in full
          colour, they read as the sign-off they were written to be. */}
      <ValueBand tone="forest" />
    </>
  );
}
