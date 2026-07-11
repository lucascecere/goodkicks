import { MetadataRoute } from 'next';
import { getTownieProducts, getGoodKicksProducts } from '@/lib/shopify/collections';
import { blogPosts } from '@/lib/blog/posts';
import { SITE_URL } from '@/lib/seo/site';

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
    url: `${siteUrl}/goodkicks/products/${p.handle}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    { url: siteUrl,                        lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 1.0 },
    { url: `${siteUrl}/shop`,              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/boston`,            lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/north-shore`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/goodkicks`,         lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/goodkicks/shop`,    lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/blog`,              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.7 },
    { url: `${siteUrl}/ambassadors`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${siteUrl}/about`,             lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/contact`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.5 },
    { url: `${siteUrl}/shipping-returns`,  lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/privacy`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
    ...townRoutes,
    ...goodKicksRoutes,
    ...blogRoutes,
  ];
}
