import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { FeaturedProduct } from '@/components/home/featured-product';
import { Pillars } from '@/components/home/pillars';
import { CommunityGrid } from '@/components/home/community-grid';
import { StitchPromo } from '@/components/home/stitch-promo';
import { InstagramFeed } from '@/components/home/instagram-feed';
import { FAQ } from '@/components/home/faq';
import { getProductByHandle } from '@/lib/products/catalog';

export const metadata: Metadata = {
  title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
  description:
    'Hand-stitched foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. $15. Free shipping on orders $30+.',
};

export default function HomePage() {
  const product = getProductByHandle('good-kicks-foot-bag');

  return (
    <>
      <Hero />
      <CommunityGrid />
      <Pillars />
      <FeaturedProduct product={product} />
      <InstagramFeed />
      <StitchPromo />
      <FAQ />
    </>
  );
}
