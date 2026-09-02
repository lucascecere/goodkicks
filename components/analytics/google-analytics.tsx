'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { siteBrand } from '@/lib/brand/site-brand';

// Google Analytics (GA4), one property per brand.
//
// Townies and Good Kicks share this app but NOT their numbers, so each brand
// reports into its own property and /admin reports into neither.
//
// Brand comes from siteBrand(host, pathname) — the same helper the chrome uses
// — and NOT from usePathname() alone. On goodkicks.co the middleware rewrites
// "/" → /goodkicks, so the server renders Good Kicks while the client pathname
// still reads "/": a pathname-only check calls that Townies. That is exactly
// what happened here, and every goodkicks.co visitor was logged into the
// Townies property from 2026-07-04 until this was fixed. The server-provided
// `host` is the reliable signal, so the root layout passes it down.
const GA_IDS = {
  townies: 'G-8F3ZCCGXC2',
  goodkicks: 'G-7M4VXBHXB7',
} as const;

export function GoogleAnalytics({ host = '' }: { host?: string }) {
  const pathname = usePathname();

  // Admin is internal traffic — it belongs in neither brand's property.
  if (pathname.startsWith('/admin')) return null;

  const gaId = GA_IDS[siteBrand(host, pathname)];

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id={`ga-${gaId}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
