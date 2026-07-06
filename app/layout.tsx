import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DM_Serif_Display, Inter, Rokkitt, Yellowtail } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SiteWrapper } from '@/components/layout/site-wrapper';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import './globals.css';

// Retained for the GK clearance section + legacy GK/admin routes.
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  variable: '--font-dm-serif',
  weight: '400',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Townies "College Block" stand-in (town names + structural headers).
// Rokkitt (bold slab serif) is the closest free match to the brand kit's bold
// collegiate-slab logo lettering — heavier than Graduate, matches the logo art.
// Loaded heavy-only so every `font-block` element renders bold by default.
// Swap to next/font/local "College Block" when a real file lands — token unchanged.
const rokkitt = Rokkitt({
  subsets: ['latin'],
  variable: '--font-rokkitt',
  weight: ['700', '800'],
  display: 'swap',
});

// Townies brand-level signature "Script" stand-in (hero signature, footer).
// Yellowtail = vintage baseball/sports script — closest free match to the brand
// kit's "Script". Swap to next/font/local with the real file later (token stays
// --font-script, so no downstream changes).
const yellowtail = Yellowtail({
  subsets: ['latin'],
  variable: '--font-yellowtail',
  weight: '400',
  display: 'swap',
});

// goodkicks.co stays primary until the townies.shop cutover.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goodkicks.co';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Townies',
    default: 'Townies — Rep Your Town.',
  },
  description:
    'Massachusetts town-pride apparel. The town is the hero. Starting with the South Shore — Scituate, Marshfield, Hingham, Weymouth, Hanover and more.',
  openGraph: {
    siteName: 'Townies',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48 64x64' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: { url: '/apple-icon.png', sizes: '180x180' },
  },
  manifest: '/manifest.json',
  verification: {
    google: 'jj1VpQq3Fpy3uZj8gXTk13Kbl86fUXlSvyXX-SoRsaY',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get('host') ?? '';

  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${inter.variable} ${rokkitt.variable} ${yellowtail.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Townies',
                url: siteUrl,
                logo: `${siteUrl}/icon.png`,
                sameAs: ['https://www.instagram.com/townies'],
                description: 'Massachusetts town-pride apparel. The town is the hero, Townies is the label.',
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Townies',
                url: siteUrl,
                potentialAction: {
                  '@type': 'SearchAction',
                  target: {
                    '@type': 'EntryPoint',
                    urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
                  },
                  'query-input': 'required name=search_term_string',
                },
              },
            ]),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-town-forest text-white px-4 py-2 rounded z-[100]"
        >
          Skip to content
        </a>
        <SiteWrapper host={host}>{children}</SiteWrapper>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
