import { MetadataRoute } from 'next';
import { storefrontClient } from '@/lib/shopify/client';
import { ALL_PRODUCT_HANDLES_QUERY } from '@/lib/shopify/queries';
import { flattenEdges } from '@/lib/shopify/transforms';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goodkicks.co';

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data } = await storefrontClient.request(ALL_PRODUCT_HANDLES_QUERY);
    const products = flattenEdges(data?.products ?? { edges: [] }) as Array<{ handle: string }>;
    productRoutes = products.map((p) => ({
      url: `${siteUrl}/products/${p.handle}`,
      lastModified: new Date(),
      priority: 0.8,
    }));
  } catch {
    // If Shopify isn't configured yet, return static routes only
  }

  return [
    { url: siteUrl, lastModified: new Date(), priority: 1 },
    { url: `${siteUrl}/about`, lastModified: new Date(), priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), priority: 0.5 },
    { url: `${siteUrl}/cart`, lastModified: new Date(), priority: 0.3 },
    ...productRoutes,
  ];
}
