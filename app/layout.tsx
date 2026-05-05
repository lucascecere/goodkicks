import type { Metadata } from 'next';
import { DM_Serif_Display, Inter } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { SiteWrapper } from '@/components/layout/site-wrapper';
import './globals.css';

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://goodkicks.co'),
  title: {
    template: '%s | Good Kicks',
    default: 'Good Kicks — Make the circle bigger.',
  },
  description:
    'Hand-stitched foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.',
  openGraph: {
    siteName: 'Good Kicks',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${inter.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Good Kicks',
              url: 'https://goodkicks.co',
              logo: 'https://goodkicks.co/icon.png',
              description: 'Hand-stitched foot bags — what everyone calls hacky sacks — built for college circles and everyone keeping the game going.',
            }),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-rust text-white px-4 py-2 rounded z-[100]"
        >
          Skip to content
        </a>
        <SiteWrapper>{children}</SiteWrapper>
        <Analytics />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7M4VXBHXB7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7M4VXBHXB7');
          `}
        </Script>
      </body>
    </html>
  );
}
