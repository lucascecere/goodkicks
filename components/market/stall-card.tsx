import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { MARKET_BASE } from '@/lib/shop/paths';
import { dollars } from '@/lib/shop/money';
import type { Stall } from '@/lib/shop/market';
import { Awning, awningTone } from './awning';
import { SellerMark } from './seller-mark';

// One stall at the market: the awning, the sign (logo, name, town), and the
// first few hats laid out on the table.
export function StallCard({ stall }: { stall: Stall }) {
  const { seller, hats } = stall;
  const shown = hats.slice(0, 3);
  const from = Math.min(...hats.map((h) => h.price_cents ?? Infinity));
  return (
    <Link href={`${MARKET_BASE}/${seller.slug}`} className="group block">
      <Awning tone={awningTone(seller.slug)} />
      <div className="border-x border-b border-rule bg-white px-4 pb-4 pt-3 transition-colors group-hover:border-text/30">
        <div className="flex items-center gap-3">
          <SellerMark seller={seller} size={48} />
          <div className="min-w-0">
            <p className="font-block text-lg font-bold leading-tight text-text">{seller.name}</p>
            {seller.town && (
              <p className="mt-0.5 flex items-center gap-1 text-[0.8125rem] text-muted">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> {seller.town}
              </p>
            )}
          </div>
        </div>
        {seller.blurb && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{seller.blurb}</p>}

        {/* The table: hats side by side on the studio ground. */}
        <div className="mt-4 grid grid-cols-3 gap-1.5 bg-[#F1EEE8] p-1.5">
          {shown.map((h) => (
            <div key={h.id} className="relative aspect-square">
              {h.image_url && (
                <Image src={h.image_url} alt={h.title} fill sizes="(max-width: 640px) 30vw, 140px" className="object-contain p-1 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]" />
              )}
            </div>
          ))}
          {Array.from({ length: 3 - shown.length }).map((_, i) => (
            <div key={`e${i}`} className="aspect-square" />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[0.8125rem]">
          <span className="text-muted">
            {hats.length} hat{hats.length === 1 ? '' : 's'} · from {dollars(from)}
          </span>
          <span className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-text group-hover:underline underline-offset-4">
            Visit stall →
          </span>
        </div>
      </div>
    </Link>
  );
}
