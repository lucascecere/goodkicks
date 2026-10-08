import type { Metadata } from 'next';
import { HatWheelHero, type WheelHat } from '@/components/townies/v2/hat-wheel-hero';
import { price } from '@/components/townies/v2/studio';
import { TownCrests } from '@/components/townies/v2/town-crests';
import { HatShelf } from '@/components/townies/v2/hat-shelf';
import { RegionCards } from '@/components/townies/v2/region-cards';
import { BulkSplit } from '@/components/townies/v2/bulk-split';
import { CampaignBand } from '@/components/townies/campaign-band';
import { ReviewBand } from '@/components/townies/review-band';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townKey, hatStyle } from '@/lib/townies/towns';
import { stockTier } from '@/lib/townies/stock-tier';

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: 'Townies Apparel Co. | Embroidered Hats for Massachusetts Towns' },
  description:
    'Embroidered snapbacks for Massachusetts towns: Milton, Quincy, Braintree, Dorchester, Hingham and more. The zip, the year, the nickname only locals use.',
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
 * hat-wheel hero (scroll turns the wheel) → town badge slider → hat grid → one photo band → regions → bulk →
 * reviews (empty until real ones exist) → sign-up (site-wide, SiteWrapper) → footer.
 *
 * Every hat is a real Shopify shot on the shared studio ground (see
 * components/townies/v2/studio.ts). The only lifestyle photo on the page is the
 * approved Milton ledge; no generated imagery beyond what's already approved.
 */
export default async function HomePage() {
  const products = await getTownieProducts();

  // The hero wheel: one hat per town, Milton (the first town) leading, then
  // whatever is buyable today. Eight stops keeps the pinned scroll short.
  const ranked = [...products].sort((a, b) => stockTier(a) - stockTier(b));
  const seen = new Set<string>();
  const wheelProducts = [
    ...ranked.filter((p) => townKey(p).slug === 'milton' && hatStyle(p.title) === 'lifestyle'),
    ...ranked,
  ].filter((p) => {
    const slug = townKey(p).slug;
    if (!p.featuredImage?.url || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  }).slice(0, 8);
  const wheel: WheelHat[] = wheelProducts.map((p) => ({
    id: p.id,
    src: p.featuredImage!.url,
    alt: p.featuredImage!.altText ?? p.title,
    title: p.title,
    price: price(p),
    href: `/products/${p.handle}`,
  }));
  const townCount = new Set(products.map((p) => townKey(p).slug)).size;

  return (
    <>
      <HatWheelHero
        hats={wheel}
        eyebrow="Massachusetts · Est. 2024"
        headline="Get your town."
        sub="Embroidered hats for Massachusetts towns. The zip, the year, the nickname only locals use."
        cta={{ href: '/shop', label: 'Shop all towns' }}
        ctaSecondary={{ href: '#towns', label: 'Find your town' }}
      />

      <TownCrests products={products} />

      <HatShelf
        products={products}
        title="The hats"
        sub={`${townCount} towns so far, all embroidered. More on the way.`}
        link={{ href: '/shop', label: 'Shop all' }}
      />

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
