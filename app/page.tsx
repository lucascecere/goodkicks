import type { Metadata } from 'next';
import { Hero } from '@/components/townies/hero';
import { TownsGrid } from '@/components/townies/towns-grid';
import { TownTicker } from '@/components/townies/town-ticker';
import { CampaignBand } from '@/components/townies/campaign-band';
import { HatSackBand } from '@/components/townies/hat-sack-band';
import { BuildsTiles } from '@/components/townies/builds-tiles';
import { RegionIndex } from '@/components/townies/region-index';
import { ReviewBand } from '@/components/townies/review-band';
import { UgcBand } from '@/components/townies/ugc-band';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';

export const revalidate = 60;

/**
 * The hero rotation. Each slide is a campaign — its own photograph, its own
 * line, its own link — rather than a backdrop swap behind fixed copy.
 *
 * Two slides today: the clover shoot and the Milton drop shoot. These used to be
 * split across the hero and two campaign bands, which meant the same towns
 * appeared twice in the first two screens — consolidating them here is why the
 * bands are gone. A carousel cannot manufacture variety the photography doesn't
 * have; it can only re-show the same pictures further down the page.
 *
 * Add a slide per shoot as new photography lands. A slide needs a 16:10 crop
 * for desktop, a squarer `mobileSrc` (a 16:10 frame does not survive a phone),
 * and the bottom-left kept clear of product — that is where the caption sits.
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
    ctaSecondary: { href: '/shop#regions', label: 'Shop by region' },
  },
  // ONE slide on purpose. The Milton curb shoot used to be slide two; a
  // carousel hides whichever photograph isn't up, so Milton now has the
  // campaign band below the grid and every photograph on the page is always
  // visible. The Braintree slide stays retired: both Braintree frames show
  // the archived '02184' alongside the Lifestyle and cannot be cropped apart.
];

export const metadata: Metadata = {
  title: { absolute: 'Townies Apparel Co. | Massachusetts Town Hats — Rep Your Town' },
  description:
    'Massachusetts town-pride hats for people who rep where they’re from. Stitched heavy, one town at a time — Milton, Weymouth, Hingham, Braintree and more. South Shore first.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Townies Apparel Co. — Massachusetts Town Hats',
    description: 'Massachusetts town-pride apparel. The town is the hero, Townies is the label.',
    url: '/',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
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
      {/* No proof chips in the hero any more: the announcement strip already
          carries the same standing facts, and the '47 hero is a photograph, a
          line and a button. */}
      <Hero slides={HERO_SLIDES} align="left" />

      <TownTicker towns={tickerTowns} tone="light" />

      {/* The product grid, No Rivals density: eight hats, four across, nothing
          under the tile but the name and the price. Adding to cart is the
          shop's job. */}
      <TownsGrid products={products} townCount={tickerTowns.length} />

      <HatSackBand />

      {/* The '47 spine: full-bleed photograph, caption in one corner, one
          button. Milton is the first town and the one we're asked for most,
          and the curb shoot is the strongest frame we own. */}
      <CampaignBand
        src="/brand/scene/milton-21x9.jpg"
        mobileSrc="/brand/drops/milton.jpg"
        alt="Two Milton Townies snapbacks on a curb in Milton Village"
        eyebrow="The first town"
        title="Milton. 1640."
        sub="Where this started, and still the one we get asked for most."
        cta={{ href: '/towns/milton', label: 'Shop Milton' }}
        align="left"
      />

      <BuildsTiles products={products} />

      <RegionIndex products={products} />

      {/* Both of these render NOTHING until lib/townies/reviews.ts has real
          entries. See the rule at the top of that file. */}
      <ReviewBand />

      <UgcBand />

      {/* Second photo band, caption in the opposite corner so the two read as
          two campaigns rather than one repeated block. The Braintree pile is
          the bulk story in one frame. */}
      <CampaignBand
        src="/brand/scene/bulk-order.jpg"
        alt="A pile of Braintree Townies snapbacks fresh from the embroiderer"
        eyebrow="Bulk orders"
        title="Buying for everybody?"
        sub="Teams, schools, fundraisers. Twenty-five hats or two hundred, better price per hat."
        cta={{ href: '/wholesale', label: 'Get a bulk price' }}
        align="right"
        valign="bottom"
      />
    </>
  );
}
