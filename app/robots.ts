import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SITE_URL, GOODKICKS_URL, GK_HOST_LIVE } from '@/lib/seo/site';
import { isGoodKicksHost } from '@/lib/seo/hosts';

// One robots.txt per domain. The middleware skips dotted paths, so
// goodkicks.co/robots.txt lands here too — it used to hand Google the Townies
// sitemap and `Host: townies.shop`.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const gk = GK_HOST_LIVE && isGoodKicksHost((await headers()).get('host'));
  const origin = gk ? GOODKICKS_URL : SITE_URL;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/ambassador/', '/cart', '/checkout'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
