import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { TownRequestForm } from '@/components/forms/town-request-form';

export const metadata: Metadata = {
  title: 'Request a Town — Townies',
  description: 'Do not see your town? Tell us. Every request is counted, and the towns that shout loudest get made first.',
  alternates: { canonical: '/request-a-town' },
  openGraph: {
    title: 'Request a Town — Townies',
    description: 'Do not see your town? Tell us. Every request is counted, and the towns that shout loudest get made first.',
    url: '/request-a-town',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <BrandPattern variant="ma" color="forest" opacity={0.05} size={160} fade="b" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Not on the list yet
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-6xl text-town-navy mb-4">
          Request your town.
        </h1>
        <p className="text-town-muted leading-relaxed mb-10 max-w-xl">
          We’re working out from the South Shore one town at a time. Every request gets counted — the loudest towns get made first.
        </p>

        <TownRequestForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          Already have a shop and want to stock us? Head to <Link href="/wholesale" className="underline underline-offset-4 hover:text-town-navy">wholesale</Link>. Anything else, <Link href="/support" className="underline underline-offset-4 hover:text-town-navy">support</Link> is here.
        </div>
      </div>
    </div>
  );
}
