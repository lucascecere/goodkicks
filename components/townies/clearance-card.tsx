import Link from 'next/link';
import { BrandImage } from '@/components/ui/brand-image';

export type ClearanceItem = {
  id: string;
  name: string;
  handle: string;
  image: string | null;
  price: string | null;
  available: boolean;
};

/**
 * Good Kicks clearance card — lives inside the Townies shell but keeps the GK
 * cream/rust nod. Carries a clearance badge; GK products never render on town
 * pages or in the towns grid.
 */
export function ClearanceCard({ item }: { item: ClearanceItem }) {
  return (
    <Link
      href={`/products/${item.handle}`}
      className="group block rounded-sm overflow-hidden bg-white border border-brand-rule hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-square bg-brand-cream">
        <BrandImage
          src={item.image}
          alt={`${item.name} — Good Kicks`}
          tone="cream"
          label={item.name}
          sizes="(max-width: 640px) 50vw, 25vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 bg-brand-rust text-white text-[10px] uppercase tracking-[0.15em] font-semibold px-2 py-1 rounded-sm">
          Clearance
        </span>
        {!item.available && (
          <span className="absolute top-3 right-3 bg-brand-ink/80 text-white text-[10px] uppercase tracking-[0.12em] px-2 py-1 rounded-sm">
            Sold out
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-xl text-brand-ink lowercase">{item.name}</p>
        {item.price && <p className="text-brand-muted text-sm mt-1">{item.price}</p>}
      </div>
    </Link>
  );
}
