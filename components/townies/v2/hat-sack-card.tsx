import Image from 'next/image';
import Link from 'next/link';
import { HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';

// The Hat & Sack offer as one more card in the shop grid, the same size and
// rhythm as a hat card, so the bundle is pushed where people are choosing
// without a band above the hats (Lucas, 10-09: "no section up top").
export function HatSackCard({ fromCents }: { fromCents: number }) {
  return (
    <Link href={HAT_SACK_PATH} className="group block">
      <div className="relative flex aspect-square items-center justify-center gap-[4%] overflow-hidden bg-band px-[8%]">
        <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-band">
          Bundle
        </span>
        <div className="relative aspect-square w-[42%] overflow-hidden rounded-full bg-[#F1EEE8] transition-transform duration-500 group-hover:scale-[1.04]">
          <Image src="/brand/product/mil-front15.jpg" alt="A Townies hat" fill sizes="20vw" className="object-contain p-[8%] mix-blend-multiply" />
        </div>
        <span className="font-block text-2xl font-bold text-white/80 sm:text-3xl">+</span>
        <span className="absolute inset-x-3 bottom-3 text-center text-[0.6875rem] leading-snug text-white/85 sm:text-[0.75rem]">
          Any hat + a foot bag, shipping included
        </span>
        <div className="relative aspect-square w-[42%] overflow-hidden rounded-full bg-[#F1EEE8] transition-transform duration-500 group-hover:scale-[1.04]">
          <Image src="/brand/product/gk-sack-massachusetts.jpg" alt="A Good Kicks foot bag" fill sizes="20vw" className="object-contain p-[12%] mix-blend-multiply" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-3">
        <p className="text-[0.9375rem] font-medium leading-snug text-text">The Hat &amp; Sack</p>
        <p className="shrink-0 text-[0.9375rem] text-text">From {formatUsd(fromCents)}</p>
      </div>
      <span className="mt-3 block w-full border border-text py-3 text-center font-label text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors group-hover:bg-text group-hover:text-white">
        Build yours
      </span>
    </Link>
  );
}
