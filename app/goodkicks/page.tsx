import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { Pillars } from '@/components/home/pillars';
import { FeaturedProduct } from '@/components/home/featured-product';
import { BogoSection } from '@/components/home/bogo-section';
import { AmbassadorPromo } from '@/components/home/ambassador-promo';
import { InstagramFeed } from '@/components/home/instagram-feed';
import { FAQ } from '@/components/home/faq';

export const metadata: Metadata = {
  title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
  description:
    'Premium foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. Six colorways, in stock.',
  alternates: { canonical: '/goodkicks' },
};

export default function GoodKicksHome() {
  return (
    <>
      <Hero />
      <Pillars />
      <FeaturedProduct />
      <BogoSection />
      <AmbassadorPromo />
      <InstagramFeed />
      <FAQ />
    </>
  );
}
