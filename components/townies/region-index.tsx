import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { groupByRegion, groupByTown, regionHref } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * Shop by region, as a printed index rather than a row of cards.
 *
 * No region has been photographed as a region, and a card with a product
 * shot in it just repeated the grid above. A list of big region names with
 * their towns set beside them says the same thing in a form that needs no
 * photograph, reads at a glance, and will still work at forty towns.
 */
export function RegionIndex({ products }: { products: CollectionProduct[] }) {
  const groups = groupByRegion(groupByTown(products)).filter((g) => g.towns.length > 0);
  if (groups.length === 0) return null;

  const row =
    'group grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(0,19rem)_1fr_auto] items-baseline gap-x-6 gap-y-1.5 border-b border-text/15 py-5 sm:py-6 -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors hover:bg-surface';

  return (
    <section className="bg-bg border-t border-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <SectionHeader
          title="Where are you from?"
          sub="Filed by coast and county. Every Massachusetts town, eventually."
          link={{ href: '/shop', label: 'Every town' }}
        />

        <ol className="border-t border-text/15">
          {groups.map((g) => (
            <li key={g.region}>
              <Link href={regionHref(g.region)} className={row}>
                <h3 className="display text-2xl sm:text-3xl lg:text-[2.125rem] whitespace-nowrap">{g.label}</h3>
                <span className="justify-self-end sm:order-3 flex items-center gap-3 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-text">
                  {g.towns.length} {g.towns.length === 1 ? 'town' : 'towns'}
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
                <p className="col-span-2 sm:col-span-1 sm:order-2 min-w-0 truncate text-sm sm:text-[0.9375rem] text-muted">
                  {g.towns.map((t) => t.name).join(' · ')}
                </p>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/request-a-town" className={row}>
              <h3 className="display text-2xl sm:text-3xl lg:text-[2.125rem] whitespace-nowrap">Your town</h3>
              <span className="justify-self-end sm:order-3 flex items-center gap-3 whitespace-nowrap text-[0.6875rem] uppercase tracking-[0.18em] text-text underline underline-offset-[6px] decoration-1">
                Request it
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </span>
              <p className="col-span-2 sm:col-span-1 sm:order-2 min-w-0 text-sm sm:text-[0.9375rem] text-muted">
                Not on the map yet? Every request gets counted, and the loudest towns get made first.
              </p>
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
