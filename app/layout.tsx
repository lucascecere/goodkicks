import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DM_Serif_Display, Figtree, Inter, Rokkitt, Yellowtail } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SiteWrapper } from '@/components/layout/site-wrapper';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { SITE_URL, organizationSchema, websiteSchema } from '@/lib/seo/site';
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
  // 'variable', not a list of cuts: multi-weight queries intermittently fail
  // the Turbopack Google Fonts loader on Vercel ("queries have exactly one entry").
  weight: 'variable',
  display: 'swap',
});

// Townies "College Block" stand-in (town names + structural headers).
// Rokkitt (bold slab serif) is the closest free match to the brand kit's bold
// collegiate-slab logo lettering — heavier than Graduate, matches the logo art.
// Loaded as the variable font: `heading` sets 700, `display` sets 600, and
// Turbopack's Google Fonts loader refuses a static 600 cut of this family.
// Swap to next/font/local "College Block" when a real file lands — token unchanged.
const rokkitt = Rokkitt({
  subsets: ['latin'],
  variable: '--font-rokkitt',
  weight: 'variable',
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

// Townies label face (brand kit 2026): eyebrows, nav, buttons, small caps.
// Figtree bold, tracked, matches the lettering on the Sign.
const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  weight: 'variable',
  display: 'swap',
});

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Townies',
    default: 'Townies Apparel Co. | Embroidered Hats for Massachusetts Towns',
  },
  description:
    'Embroidered snapbacks for Massachusetts towns, from Milton to West Roxbury, plus custom embroidered hats for local businesses, teams and schools.',
  openGraph: {
    siteName: 'Townies',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/opengraph-image.jpg'],
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
    // townies.shop's own Google Search Console token — set via env once the
    // property is verified (the previous hardcoded token was Good Kicks').
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
      className={`${dmSerifDisplay.variable} ${inter.variable} ${rokkitt.variable} ${yellowtail.variable} ${figtree.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema(), websiteSchema()]),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-accent text-white px-4 py-2 rounded z-[100]"
        >
          Skip to content
        </a>
        <SiteWrapper host={host}>{children}</SiteWrapper>
        <Analytics />
        <GoogleAnalytics host={host} />
      </body>
    </html>
  );
}
