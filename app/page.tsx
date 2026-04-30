import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { FeaturedProduct } from '@/components/home/featured-product';
import { Pillars } from '@/components/home/pillars';
import { CommunityGrid } from '@/components/home/community-grid';
import { StitchPromo } from '@/components/home/stitch-promo';
import { InstagramFeed } from '@/components/home/instagram-feed';
import { NewsletterCta } from '@/components/home/newsletter-cta';
import { FAQ } from '@/components/home/faq';
import { storefrontClient } from '@/lib/shopify/client';
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries';
import type { ShopifyProduct } from '@/lib/shopify/types';

export const metadata: Metadata = {
  title: 'Good Kicks — The Best Foot Bag (Hacky Sack) for Your Circle',
  description:
    'Hand-stitched foot bags — what everyone calls hacky sacks — built for dorm circles, campus quads, and every backpack that needs one. $15. Free shipping on orders $40+.',
};

const FEATURED_PRODUCT_HANDLE = 'good-kicks-hacky-sack';

async function getFeaturedProduct(): Promise<ShopifyProduct | null> {
  try {
    const { data } = await storefrontClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle: FEATURED_PRODUCT_HANDLE },
    });
    return (data?.product as ShopifyProduct) ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const product = await getFeaturedProduct();

  return (
    <>
      <Hero />
      <FeaturedProduct product={product} />
      <Pillars />
      <CommunityGrid />
      <StitchPromo />
      <InstagramFeed />
      <NewsletterCta />
      <FAQ />
    </>
  );
}
