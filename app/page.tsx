import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { CampaignBand } from '@/components/townies/campaign-band';
import { FeaturedRail } from '@/components/townies/featured-rail';
import { TownTicker } from '@/components/townies/town-ticker';
import { TaglineBand } from '@/components/townies/tagline-band';
import { ValueBand } from '@/components/townies/value-band';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';

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

/**
 * Photograph, thin band, photograph, rail, quiet, close.
 *
 * The old page ran hero → ticker → product grid → duotone band → town carousel
 * → editorial split → value band → CTA, and rendered 9,174px tall at 1440. Most
 * of that was type: a 128px hero headline and 60px section headings stacked in
 * full-viewport sections. Now every photographic slot holds a real photograph,
 * every headline sits on the shared ramp, and the sections that were never
 * going to have photography (tagline, values, request-a-town) say so with
 * pattern and type instead of a stock picture standing in for one.
 */
export default async function HomePage() {
  const products = await getTownieProducts();
  const tickerTowns = [...new Set(products.map((p) => townKey(p).name))];

  return (
    <>
      <Hero
        imageSrc="/brand/scene/clover-hero-16x10.jpg"
        mobileSrc="/brand/scene/clover-hero-1x1.jpg"
        imageAlt="Milton, Walpole and West Roxbury Townies snapbacks in a bed of clover"
      />

      <TownTicker towns={tickerTowns} />

      {/* The two campaign bands are the two real town shoots we own. They
          alternate their caption side so they don't read as one component
          rendered twice. */}
      <CampaignBand
        src="/brand/scene/milton-21x9.jpg"
        mobileSrc="/brand/drops/milton.jpg"
        alt="Two Milton Townies snapbacks on a curb in Milton Village"
        eyebrow="The first town"
        title="Milton. 1640."
        sub="Where this started, and still the one we get asked for most."
        cta={{ href: '/shop?town=milton', label: 'Shop Milton' }}
        align="left"
      />

      <FeaturedRail products={products} />

      <CampaignBand
        src="/brand/scene/braintree-21x9.jpg"
        mobileSrc="/brand/drops/braintree.jpg"
        alt="Braintree Townies snapbacks on a curb outside Braintree Books"
        eyebrow="Now shipping"
        title="Braintree."
        sub="Stitched heavy, worn in from day one."
        cta={{ href: '/shop?town=braintree', label: 'Shop Braintree' }}
        align="right"
        valign="bottom"
      />

      <TaglineBand />

      <ValueBand />

      <RequestTownBand />
    </>
  );
}
