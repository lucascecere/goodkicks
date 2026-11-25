import type { Metadata } from 'next';
import { PhotoHero } from '@/components/townies/v2/photo-hero';
import { TownCrests } from '@/components/townies/v2/town-crests';
import { HatShelf } from '@/components/townies/v2/hat-shelf';
import { RegionCards } from '@/components/townies/v2/region-cards';
import { BulkSplit } from '@/components/townies/v2/bulk-split';
import { HatSackBand } from '@/components/townies/hat-sack-band';
import { CampaignBand } from '@/components/townies/campaign-band';
import { ReviewBand } from '@/components/townies/review-band';
import { giveawayOpen } from '@/lib/townies/giveaway';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';
import { getReviewSummaries } from '@/lib/reviews/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'Townies Apparel Co. | Embroidered Hats for Massachusetts Towns' },
  description:
    'Embroidered snapbacks for Massachusetts towns: Milton, Quincy, Braintree, Dorchester, Norwood and more. The zip, the year, the nickname only locals use.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Townies Apparel Co. | Hats for Massachusetts towns',
    description: 'Embroidered hats for Massachusetts towns. Est. 2024.',
    url: '/',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
};

/**
 * v2 home (2026-10), modelled on melin.com with Homefield's shop-by-school row:
 * clean photo hero (11-25; the giveaway through Dec 6) → town badge slider → hat grid → one photo band → regions → bulk →
 * reviews (empty until real ones exist) → sign-up (site-wide, SiteWrapper) → footer.
 *
 * Every hat is a real Shopify shot on the shared studio ground (see
 * components/townies/v2/studio.ts). The only lifestyle photo on the page is the
 * approved Milton ledge; no generated imagery beyond what's already approved.
 */
export default async function HomePage() {
  const [products, ratings] = await Promise.all([getTownieProducts(), getReviewSummaries()]);

  // Titletown is a Boston nickname hat, not a town, so it isn't counted.
  const townCount = new Set(products.map((p) => townKey(p).slug).filter((slug) => slug !== 'titletown')).size;

  return (
    <>
      {/* Clean photo hero (Lucas 11-25, replaced the hat wheel). Through Dec 6 the
          hero IS the town hat giveaway; after that it is the brand hero. */}
      {giveawayOpen() ? (
        <PhotoHero
          desktopSrc="/brand/scene/giveaway-norwood-hero.jpg"
          mobileSrc="/brand/scene/giveaway-norwood.jpg"
          alt="The Norwood Townies hat on a wrapped gift box"
          eyebrow="Giveaway · enter by Sunday, Dec 6"
          headline="Win your town’s hat."
          sub="One free hat for every town. Pick yours and enter in ten seconds. Winners picked Monday, Dec 7."
          cta={{ href: '/giveaway?utm_source=home', label: 'Enter the giveaway' }}
          ctaSecondary={{ href: '/shop', label: 'Shop all towns' }}
          focus="72% 55%"
        />
      ) : (
        <PhotoHero
          desktopSrc="/brand/scene/milton-21x9.jpg"
          mobileSrc="/brand/drops/milton.jpg"
          alt="Two Milton Townies snapbacks on a curb in Milton Village"
          eyebrow="Massachusetts · Est. 2024"
          headline="Get your town."
          sub="Embroidered hats for Massachusetts towns. The zip, the year, the nickname only locals use."
          cta={{ href: '/shop', label: 'Shop all towns' }}
          ctaSecondary={{ href: '#towns', label: 'Find your town' }}
        />
      )}

      <TownCrests products={products} />

      <HatShelf
        products={products}
        title="The hats"
        sub={`${townCount} towns so far, all embroidered. More on the way.`}
        link={{ href: '/shop', label: 'Shop all' }}
        ratings={ratings}
      />

      <HatSackBand />

      <CampaignBand
        src="/brand/scene/milton-21x9.jpg"
        mobileSrc="/brand/drops/milton.jpg"
        alt="Two Milton Townies snapbacks on a curb in Milton Village"
        eyebrow="The first town"
        title="Milton. 1640."
        sub="The first town we made. Still the most asked for."
        cta={{ href: '/towns/milton', label: 'Shop Milton' }}
        align="left"
      />

      <RegionCards products={products} />

      <BulkSplit />

      <ReviewBand />

    </>
  );
}
