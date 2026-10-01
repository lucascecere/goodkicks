import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { ProductCard } from './product-card';
import { stockTier } from '@/lib/townies/stock-tier';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * The homepage product grid: eight hats, four across, full tile size.
 *
 * Replaces the scrolling rail. A rail at 1440 showed five small tiles with a
 * sixth cut off at the viewport edge, which read as a layout bug rather than
 * an invitation to scroll. Eight in a grid is the product moment the page
 * needs after the hero, and the "all N towns" link carries the rest.
 *
 * Ordered the way the shop is: in stock, then pre-order, then sold out, so a
 * first-time visitor meets a hat they can actually buy today.
 */
export function TownsGrid({
  products,
  townCount,
  count = 8,
}: {
  products: CollectionProduct[];
  townCount: number;
  count?: number;
}) {
  const shown = [...products].sort((a, b) => stockTier(a) - stockTier(b)).slice(0, count);
  if (shown.length === 0) return null;
  const allLabel = `All ${townCount} ${townCount === 1 ? 'town' : 'towns'}`;

  return (
    <section className="bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SectionHeader
          title="Every town so far."
          sub="Twelve towns and counting, stitched not printed. Pick yours."
          link={{ href: '/shop', label: allLabel }}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
          {shown.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} quickAdd={false} />
          ))}
        </div>
        {/* The header's link hides on phones, so the grid closes with it. */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center rounded-none border border-text/30 px-7 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-text hover:text-bg"
          >
            {allLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
