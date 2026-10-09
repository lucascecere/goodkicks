import Link from 'next/link';
import Image from 'next/image';
import { MARKET_BASE } from '@/lib/shop/paths';
import { dollars } from '@/lib/shop/money';
import type { Stall } from '@/lib/shop/market';
import { SellerMark } from './seller-mark';
import { Awning, awningTone } from './awning';

// One shop on the market page, modelled on Goodee's makers grid: a single big
// picture, then the name and a quiet line of facts. The picture is the shop's
// own photo (storefront, people wearing the hat) when we have one; otherwise
// their lead hat, large, on the studio ground the rest of Townies uses.
export function StallCard({ stall, priority = false, open = true }: { stall: Stall; priority?: boolean; open?: boolean }) {
  const { seller, hats } = stall;
  const lead = hats[0];
  const from = Math.min(...hats.map((h) => h.price_cents ?? Infinity));
  const sizes = '(max-width: 1024px) 50vw, 33vw';

  return (
    <Link href={`${MARKET_BASE}/${seller.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F1EEE8]">
        <Awning tone={awningTone(seller.slug)} className="absolute inset-x-0 top-0 z-10" />
        {seller.cover_url ? (
          <Image
            src={seller.cover_url}
            alt={seller.name}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          lead?.image_url && (
            <Image
              src={lead.image_url}
              alt={`${seller.name} ${lead.title}`}
              fill
              priority={priority}
              sizes={sizes}
              className="object-contain p-[12%] mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )
        )}
        <div className="absolute bottom-2 left-2 rounded-full ring-2 ring-white/90 sm:bottom-3 sm:left-3 sm:ring-4">
          <SellerMark seller={seller} size={44} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[0.875rem] font-semibold leading-snug sm:text-[0.9375rem] text-text group-hover:underline group-hover:underline-offset-4">
          {seller.name}
        </p>
        <p className="mt-0.5 text-[0.75rem] text-muted sm:text-[0.8125rem]">
          {[seller.town, `${hats.length} hat${hats.length === 1 ? '' : 's'}`, open ? `from ${dollars(from)}` : 'Coming soon'].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}
