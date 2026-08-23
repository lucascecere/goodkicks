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
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
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
