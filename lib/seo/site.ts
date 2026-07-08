// Central SEO / business facts for Townies — single source of truth for
// structured data (JSON-LD) and NAP consistency with the Google Business
// Profile. Keep name / areaServed / phone EXACTLY matched to the GBP; NAP
// mismatches across the web weaken local ranking.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://townies.shop';

export const BUSINESS = {
  name: 'Townies Apparel Co.',
  shortName: 'Townies',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  ogImage: `${SITE_URL}/opengraph-image.png`,
  description:
    'Massachusetts town-pride apparel. The town is the hero — Townies is the label. Starting with the South Shore.',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@townies.shop',
  // Set once confirmed for the Google Business Profile (kept blank until then
  // rather than guessed — a wrong number is worse than none for NAP).
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? '',
  foundingYear: '2024',
  areaServed: 'Massachusetts',
  sameAs: [
    'https://www.instagram.com/townies',
    'https://www.tiktok.com/@townies',
  ],
} as const;

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    alternateName: BUSINESS.shortName,
    url: BUSINESS.url,
    logo: BUSINESS.logo,
    image: BUSINESS.ogImage,
    description: BUSINESS.description,
    foundingDate: BUSINESS.foundingYear,
    email: BUSINESS.email,
    ...(BUSINESS.phone ? { telephone: BUSINESS.phone } : {}),
    areaServed: { '@type': 'State', name: BUSINESS.areaServed },
    sameAs: BUSINESS.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: BUSINESS.email,
      areaServed: 'US',
      availableLanguage: 'English',
    },
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BUSINESS.shortName,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.path.startsWith('http') ? it.path : `${SITE_URL}${it.path}`,
    })),
  };
}
