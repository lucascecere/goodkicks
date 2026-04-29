import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import { FeaturedProduct } from '@/components/home/featured-product';
import { Pillars } from '@/components/home/pillars';
import { CommunityGrid } from '@/components/home/community-grid';
import { storefrontClient } from '@/lib/shopify/client';
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries';
import type { ShopifyProduct } from '@/lib/shopify/types';

export const metadata: Metadata = {
  title: 'Good Kicks — Make the circle bigger.',
  description:
    'Hand-stitched foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one. $15. Free shipping on orders $40+.',
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
    </>
  );
}
