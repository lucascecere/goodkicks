import Link from 'next/link';
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
  ratings = {},
}: {
  ratings?: Record<string, { count: number; average: number }>;
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
            // Phones show the first four; the rest is one tap away (the home
            // page ran ~17 phone screens with all eight stacked).
            <div key={p.id} className={i >= 4 ? 'max-sm:hidden' : undefined}>
              <HatCard product={p} priority={i < 4} rating={ratings[p.handle]} />
            </div>
          ))}
        </div>
        {link && shown.length > 4 && (
          <Link
            href={link.href}
            className="font-label mt-8 flex min-h-12 items-center justify-center border border-text text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text sm:hidden"
          >
            {link.label}
          </Link>
        )}
      </div>
    </section>
  );
}
