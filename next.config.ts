import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/partners', destination: '/ambassadors', permanent: true },
      // Contact is split into support / request-a-town / wholesale / ambassadors.
      //
      // Host-scoped, and it has to be: next.config redirects run BEFORE
      // middleware, so an unscoped /contact rule fires on goodkicks.co too and
      // lands a foot-bag customer on the Townies support page — which the host
      // rewrite could never undo, because the redirect already happened.
      // Destination is '/support', NOT '/goodkicks/support': this redirect runs
      // first, and the middleware host rewrite then prepends /goodkicks itself.
      // Targeting the prefixed path produced goodkicks.co/goodkicks/support.
      {
        source: '/contact',
        destination: '/support',
        permanent: true,
        has: [{ type: 'host', value: '(www\\.)?goodkicks\\.co' }],
      },
      { source: '/contact', destination: '/support', permanent: true },
      // 2026-10-07: Shipping & Returns split into two Terms pages. Townies host
      // only: on goodkicks.co the middleware rewrites /shipping-returns to the
      // Good Kicks page, and next.config redirects run before middleware.
      // 2026-10-08: the blog is retired (Lucas: "scratch the blog"). Old links
      // and indexed posts go home rather than 404. Townies host only.
      { source: '/blog', destination: '/', permanent: true, missing: [{ type: 'host', value: '(www\\.)?goodkicks\\.co' }] },
      { source: '/blog/:slug*', destination: '/', permanent: true, missing: [{ type: 'host', value: '(www\\.)?goodkicks\\.co' }] },
      {
        source: '/shipping-returns',
        destination: '/shipping-policy',
        permanent: true,
        missing: [{ type: 'host', value: '(www\\.)?goodkicks\\.co' }],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      // Local market logos and hat photos (Supabase Storage, bucket `shop`).
      {
        protocol: 'https',
        hostname: 'blarfozjonigyqvlbejz.supabase.co',
        pathname: '/storage/v1/object/public/shop/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fbcdn.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
