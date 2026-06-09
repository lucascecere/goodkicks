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
    'Premium foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. $4 shipping, free on orders $35+.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
    description: 'Premium foot bags built for dorm circles, campus quads, and every backpack that needs one. Six colorways. $9.99 each.',
    url: 'https://goodkicks.co',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Good Kicks — The Best Foot Bag for Your Circle',
    description: 'Six colorways. $9.99 each. $4 shipping, free on orders $35+.',
    images: ['/opengraph-image.png'],
  },
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
