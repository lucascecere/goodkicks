import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { FeaturedProduct } from '@/components/home/featured-product';
import { Pillars } from '@/components/home/pillars';
import { StitchPromo } from '@/components/home/stitch-promo';
import { InstagramFeed } from '@/components/home/instagram-feed';
import { AmbassadorPromo } from '@/components/home/ambassador-promo';
import { FAQ } from '@/components/home/faq';

export const metadata: Metadata = {
  title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
  description:
    'Hand-stitched foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. Free shipping on orders $65+.',
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Pillars />
      <FeaturedProduct />
      <AmbassadorPromo />
      <InstagramFeed />
      <StitchPromo />
      <FAQ />
    </>
  );
}
