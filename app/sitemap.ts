import { MetadataRoute } from 'next';
import { getTownieProducts, getGoodKicksProducts } from '@/lib/shopify/collections';
import { towniePosts } from '@/lib/townies/blog-posts';
import { SITE_URL, gkCanonical } from '@/lib/seo/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE_URL;

  const [towns, goodKicks] = await Promise.all([
    getTownieProducts().catch(() => []),
    getGoodKicksProducts().catch(() => []),
  ]);

  const townRoutes: MetadataRoute.Sitemap = towns.map((p) => ({
    url: `${siteUrl}/products/${p.handle}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const goodKicksRoutes: MetadataRoute.Sitemap = goodKicks.map((p) => ({
    url: gkCanonical(`products/${p.handle}`),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = towniePosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    { url: siteUrl,                        lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 1.0 },
    { url: `${siteUrl}/shop`,              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/south-shore`,       lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/boston`,            lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/south-east`,        lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/north-shore`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    // Good Kicks entries follow the cutover: townies.shop/goodkicks/* while the
    // host rewrite is off, goodkicks.co/* once it is on. Listing a URL the site
    // does not serve yet is how a sitemap starts reporting 404s in Search Console.
    { url: gkCanonical(''),                lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: gkCanonical('shop'),            lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: gkCanonical('about'),           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.5 },
    { url: gkCanonical('faq'),             lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: gkCanonical('support'),         lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: gkCanonical('shipping-returns'), lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    { url: `${siteUrl}/blog`,              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.7 },
    { url: `${siteUrl}/ambassadors`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${siteUrl}/about`,             lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/support`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.5 },
    { url: `${siteUrl}/request-a-town`,    lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${siteUrl}/wholesale`,         lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/faq`,               lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/size-guide`,        lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/shipping-returns`,  lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/privacy`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
    ...townRoutes,
    ...goodKicksRoutes,
    ...blogRoutes,
  ];
}
