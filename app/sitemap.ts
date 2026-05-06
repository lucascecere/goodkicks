import { MetadataRoute } from 'next';
import { ALL_PRODUCTS } from '@/lib/products/catalog';
import { blogPosts } from '@/lib/blog/posts';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goodkicks.co';

  const productRoutes: MetadataRoute.Sitemap = ALL_PRODUCTS.map((p) => ({
    url: `${siteUrl}/products/${p.handle}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    { url: siteUrl,                              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 1.0 },
    { url: `${siteUrl}/shop`,                    lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/blog`,                    lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/ambassadors`,             lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${siteUrl}/about`,                   lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/contact`,                 lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.5 },
    { url: `${siteUrl}/shipping-returns`,        lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/privacy`,                 lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
    ...productRoutes,
    ...blogRoutes,
  ];
}
