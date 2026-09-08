import type { Metadata } from 'next';
import { Scissors, CircleDollarSign, Users, Truck } from 'lucide-react';
import { Hero } from '@/components/townies/hero';
import { TownTicker } from '@/components/townies/town-ticker';
import { FeaturedRail } from '@/components/townies/featured-rail';
import { StepsBand } from '@/components/townies/steps-band';
import { ValueBand } from '@/components/townies/value-band';
import { FaqSection } from '@/components/ui/faq-section';
import { GoodKicksPromoBand } from '@/components/goodkicks/promo-band';
import { getGoodKicksProducts } from '@/lib/shopify/collections';
import { gkDisplayName } from '@/lib/goodkicks/names';
import { GK_FAQS } from '@/lib/goodkicks/faqs';
import { GOODKICKS } from '@/lib/brand/brands';
import { gkCanonical } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
  description:
    'Premium foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. Pick your colorway, in stock, free shipping.',
  alternates: { canonical: gkCanonical('') },
};

/**
 * The Good Kicks page — the Townies homepage, in Good Kicks' clothes.
 *
 * Same spine, same components, same order: photograph → ticker → rail →
 * feature band → steps → value band → FAQ → footer. What changes is the brand
 * wrapping (tokens under data-brand), the copy, and the marks. Good Kicks has no
 * Massachusetts pattern set, so every ground here runs flat.
 *
 * One hero slide. The only Good Kicks photography is the six-tile product grid
 * and the per-colorway wood shots; the grid crops honestly to 16:10 and 1:1.
 * Add a slide when the sacks get shot in the wild.
 */
const HERO_SLIDES = [
  {
    imageSrc: '/brand/goodkicks/hero-16x10.jpg',
    mobileSrc: '/brand/goodkicks/hero-1x1.jpg',
    imageAlt: 'Six Good Kicks foot bag colorways on a wood table',
    eyebrow: 'Good Kicks · foot bags',
    headline: 'make the circle bigger.',
    sub: 'Premium foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.',
    cta: { href: GOODKICKS.shopPath, label: 'Shop the sacks' },
  },
];

const VALUE_ITEMS = [
  {
    Mark: Scissors,
    title: 'Built right.',
    body: 'Premium materials, weighted right, soft enough to control. Made by the crew that has been making them for 30+ years.',
    markClass: 'h-8 w-8',
  },
  {
    Mark: CircleDollarSign,
    title: 'Priced for the squad.',
    body: 'No premium tax, no $4 marketplace junk. Just the right foot bag at the right price.',
    markClass: 'h-8 w-8',
  },
  {
    Mark: Users,
    title: 'Made for the circle.',
    body: 'We back the school accounts, the friend-group crews, the people keeping the scene going.',
    markClass: 'h-8 w-8',
  },
  {
    Mark: Truck,
    title: 'Ships free.',
    body: 'Sacks are small and light, so shipping is on us. Out the door from Massachusetts in 1–3 business days.',
    markClass: 'h-8 w-8',
  },
];

export default async function GoodKicksHome() {
  const products = await getGoodKicksProducts();
  const names = [...new Set(products.map((p) => gkDisplayName(p.title)))];

  return (
    <>
      <Hero slides={HERO_SLIDES} mark={false} />

      <TownTicker towns={names} dot />

      <FeaturedRail
        products={products}
        eyebrow="The sacks"
        title="pick your colorway."
        link={{ href: GOODKICKS.shopPath, label: 'See all' }}
        productBase={GOODKICKS.productBase}
        names={Object.fromEntries(products.map((p) => [p.handle, gkDisplayName(p.title)]))}
        showPrice
        fit="cover"
      />

      <GoodKicksPromoBand shopPath={GOODKICKS.shopPath} />

      <StepsBand
        id="ambassadors"
        eyebrow="Ambassador program"
        title="run a school sack account? we'll back you."
        body="We partner with high school and college hacky sack accounts — your own code, a cut of every sale, and a free starter sack to kick things off."
        steps={[
          { n: '01', title: 'Your own code', body: 'A custom code that gives your followers 20% off — tied to your school or account.' },
          { n: '02', title: '8–10% commission', body: 'Earn on every order placed through your code. Paid out monthly.' },
          { n: '03', title: 'Free starter sack', body: 'One sack shipped to you on approval, so you post with the real thing in hand.' },
        ]}
        cta={{ href: GOODKICKS.supportPath, label: 'Apply to be an ambassador' }}
        secondary={{ href: '/goodkicks#faq', label: 'High school · college · freestyle · all welcome' }}
      />

      <ValueBand tone="forest" items={VALUE_ITEMS} />

      <FaqSection eyebrow="Questions" title="questions people actually ask." items={GK_FAQS} />
    </>
  );
}
