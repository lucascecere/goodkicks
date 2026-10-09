import Image from 'next/image';
import type { Seller } from '@/lib/shop/types';

/** A business's logo in a round frame, or its initials when there's no logo. */
export function SellerMark({ seller, size = 48 }: { seller: Pick<Seller, 'name' | 'logo_url'>; size?: number }) {
  const initials = seller.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-rule bg-white"
      style={{ width: size, height: size }}
    >
      {seller.logo_url ? (
        <Image src={seller.logo_url} alt={`${seller.name} logo`} fill sizes={`${size}px`} className="object-contain p-1.5" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-ink font-block font-bold text-ink-contrast" style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
