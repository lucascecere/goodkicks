import type { Metadata } from 'next';
import { BagView } from '@/components/market/bag-view';

export const metadata: Metadata = { title: 'Market bag', robots: { index: false } };

export default function BagPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <h1 className="display mb-8 text-[2.25rem] text-text sm:text-[2.75rem]">Your market bag</h1>
      <BagView />
    </div>
  );
}
