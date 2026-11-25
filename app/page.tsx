import type { Metadata } from 'next';
import { PhotoHero } from '@/components/townies/v2/photo-hero';
import { TownCrests } from '@/components/townies/v2/town-crests';
import { HatShelf } from '@/components/townies/v2/hat-shelf';
import { RegionCards } from '@/components/townies/v2/region-cards';
import { BulkSplit } from '@/components/townies/v2/bulk-split';
import { HatSackBand } from '@/components/townies/hat-sack-band';
import { CampaignBand } from '@/components/townies/campaign-band';
import { ReviewBand } from '@/components/townies/review-band';
import { homeHero } from '@/lib/townies/hero-schedule';
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

  const { phase: _phase, ...heroContent } = homeHero(process.env.HERO_NOW ? Date.parse(process.env.HERO_NOW) : Date.now());
  void _phase;
  // Titletown is a Boston nickname hat, not a town, so it isn't counted.
  const townCount = new Set(products.map((p) => townKey(p).slug).filter((slug) => slug !== 'titletown')).size;

  return (
    <>
      {/* Clean photo hero (Lucas 11-25, replaced the hat wheel). It changes by
          date on its own: giveaway -> Christmas (Dec 7) -> everyday (Dec 26).
          See lib/townies/hero-schedule.ts. HERO_NOW (ISO date) previews a phase
          on a preview deploy; never set it in production. */}
      <PhotoHero {...heroContent} />

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
