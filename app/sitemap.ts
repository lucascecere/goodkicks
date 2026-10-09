import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { getTownieProducts, getGoodKicksProducts } from '@/lib/shopify/collections';
import { townHref, townPages } from '@/lib/townies/towns';
import { SITE_URL, GK_HOST_LIVE, gkCanonical } from '@/lib/seo/site';
import { customTownHref, customTowns } from '@/lib/townies/custom-hats';
import { isGoodKicksHost } from '@/lib/seo/hosts';
import { getStalls } from '@/lib/shop/market';
import { MARKET_BASE } from '@/lib/shop/paths';

// Each domain lists only its own URLs. A sitemap on townies.shop that also
// lists goodkicks.co pages is ignored for those entries and blurs which site is
// which; goodkicks.co/sitemap.xml lands here too (the middleware skips dotted
// paths), so the host decides.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = SITE_URL;
  const gkHost = GK_HOST_LIVE && isGoodKicksHost((await headers()).get('host'));

  const [towns, goodKicks, stalls] = await Promise.all([
    getTownieProducts().catch(() => []),
    getGoodKicksProducts().catch(() => []),
    getStalls().catch(() => []),
  ]);

  // The local market: only open stalls with something to sell (getStalls
  // already drops the rest), so the sitemap never lists an empty stall.
  const marketRoutes: MetadataRoute.Sitemap = stalls.length
    ? [
        { url: `${siteUrl}${MARKET_BASE}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
        ...stalls.map((s) => ({
          url: `${siteUrl}${MARKET_BASE}/${s.seller.slug}`,
          lastModified: new Date(s.seller.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })),
        { url: `${siteUrl}${MARKET_BASE}/apply`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
      ]
    : [];

  const townRoutes: MetadataRoute.Sitemap = towns.map((p) => ({
    url: `${siteUrl}/products/${p.handle}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const townPageRoutes: MetadataRoute.Sitemap = townPages(towns).map((t) => ({
    url: `${siteUrl}${townHref(t.slug)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const customTownRoutes: MetadataRoute.Sitemap = customTowns(towns).map((t) => ({
    url: `${siteUrl}${customTownHref(t.slug)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const goodKicksRoutes: MetadataRoute.Sitemap = goodKicks.map((p) => ({
    url: gkCanonical(`products/${p.handle}`),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));


  // Good Kicks entries follow the cutover: townies.shop/goodkicks/* while the
  // host rewrite is off, goodkicks.co/* once it is on. Listing a URL the site
  // does not serve yet is how a sitemap starts reporting 404s in Search Console.
  const goodKicksPages: MetadataRoute.Sitemap = [
    { url: gkCanonical(''),                 lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: gkCanonical('shop'),             lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: gkCanonical('support'),          lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    { url: gkCanonical('shipping-returns'), lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.4 },
    ...goodKicksRoutes,
  ];
  if (gkHost) return goodKicksPages;

  const towniesPages: MetadataRoute.Sitemap = [
    { url: siteUrl,                        lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 1.0 },
    { url: `${siteUrl}/shop`,              lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/hat-and-sack`,      lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/south-shore`,       lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.9 },
    { url: `${siteUrl}/boston`,            lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/south-east`,        lastModified: new Date(), changeFrequency: 'weekly' as const,  priority: 0.8 },
    { url: `${siteUrl}/north-shore`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/ambassadors`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${siteUrl}/about`,             lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/support`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.5 },
    { url: `${siteUrl}/request-a-town`,    lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${siteUrl}/custom-hats`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.85 },
    { url: `${siteUrl}/wholesale`,         lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.6 },
    { url: `${siteUrl}/faq`,               lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${siteUrl}/size-guide`,        lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/shipping-policy`,  lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/returns-policy`,  lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.4 },
    { url: `${siteUrl}/privacy`,           lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
    ...townPageRoutes,
    ...customTownRoutes,
    ...townRoutes,
    ...marketRoutes,
  ];
  // Before the cutover the GK pages live on townies.shop, so they belong here.
  return GK_HOST_LIVE ? towniesPages : [...towniesPages, ...goodKicksPages];
}
