import type { CollectionProduct } from '@/lib/shopify/collections';
import { stockTier } from '@/lib/townies/stock-tier';
import { HatCard } from './hat-card';
import { ShelfHeader } from './shelf-header';

/** Melin's "Latest releases": a header row and four-up hat tiles. */
export function HatShelf({
  products,
  title,
  sub,
  link,
  count = 8,
}: {
  products: CollectionProduct[];
  title: string;
  sub?: string;
  link?: { href: string; label: string };
  count?: number;
}) {
  const shown = [...products].sort((a, b) => stockTier(a) - stockTier(b)).slice(0, count);
  if (shown.length === 0) return null;
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
        <ShelfHeader title={title} sub={sub} link={link} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {shown.map((p, i) => (
            <HatCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
