import type { Metadata } from 'next';
import Link from 'next/link';
import { BagView } from '@/components/market/bag-view';
import { marketOpen } from '@/lib/shop/config';

export const metadata: Metadata = { title: 'Market bag', robots: { index: false } };

export default function BagPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="display mb-8 text-[2.25rem] text-text sm:text-[2.75rem]">Your market bag</h1>
      {marketOpen() ? (
        <BagView />
      ) : (
        <div className="border border-dashed border-rule px-6 py-14 text-center">
          <p className="text-muted">Online ordering opens soon.</p>
          <Link href="/local" className="mt-4 inline-block font-label text-xs font-bold uppercase tracking-[0.16em] text-text underline underline-offset-4">
            Back to the market
          </Link>
        </div>
      )}
    </div>
  );
}
