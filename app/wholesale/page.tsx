import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { WholesaleForm } from '@/components/forms/wholesale-form';

export const metadata: Metadata = {
  title: 'Wholesale — Townies',
  description: 'Stock Townies in your shop. Tell us about the business and we come back with pricing tiers and lead times.',
  alternates: { canonical: '/wholesale' },
  openGraph: {
    title: 'Wholesale — Townies',
    description: 'Stock Townies in your shop. Tell us about the business and we come back with pricing tiers and lead times.',
    url: '/wholesale',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function Page() {
  return (
    <div className="relative overflow-hidden bg-town-cream min-h-screen">
      <BrandPattern variant="pine" color="forest" opacity={0.05} size={160} fade="b" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="text-xs uppercase tracking-[0.22em] text-town-forest font-medium mb-3">
          Wholesale
        </p>
        <h1 className="font-block uppercase text-5xl sm:text-6xl text-town-navy mb-4">
          Stock your town.
        </h1>
        <p className="text-town-muted leading-relaxed mb-10 max-w-xl">
          Shops, teams, schools and clubs. Tell us a bit about the business and the first reply comes back with real pricing tiers and lead times — not a brochure.
        </p>

        <WholesaleForm />

        <div className="mt-14 pt-8 border-t border-town-rule text-sm text-town-muted">
          Not a shop? You might want <Link href="/ambassadors" className="underline underline-offset-4 hover:text-town-navy">the ambassador program</Link> or <Link href="/request-a-town" className="underline underline-offset-4 hover:text-town-navy">a town request</Link> instead.
        </div>
      </div>
    </div>
  );
}
