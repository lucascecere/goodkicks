'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Townies Google Analytics (GA4).
//
// Brand-scoped: this tag ONLY loads on Townies pages. The Good Kicks subtree
// (/goodkicks/*, which is also what goodkicks.co serves via the middleware
// host-rewrite) and /admin never load it, so Good Kicks + admin traffic stay
// out of the Townies property. The brand check mirrors components/layout/
// site-wrapper.tsx (usePathname is the single source of truth for brand, and
// resolves correctly on goodkicks.co too). Good Kicks gets its own GA property
// later; complements the existing Vercel Analytics in app/layout.tsx.
const GA_ID = 'G-8F3ZCCGXC2';

export function GoogleAnalytics() {
  const pathname = usePathname();

  const isGoodKicks =
    pathname === '/goodkicks' || pathname.startsWith('/goodkicks/');
  const isAdmin = pathname.startsWith('/admin');
  if (isGoodKicks || isAdmin) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-townies" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
