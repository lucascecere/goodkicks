import Link from 'next/link';
import { BrandPattern } from './brand-pattern';
import { MaMark } from '@/components/brand/wordmark';
import { groupByRegion, groupByTown, regionHref } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * Shop by region.
 *
 * The catalogue is organised by Massachusetts region and will be for good —
 * every town, eventually, filed under its coast or its county. Until now the
 * regions were listed in the footer and nowhere else. This is the map, as a
 * band: one card per live region carrying its towns, and a last card for the
 * town that isn't here yet.
 *
 * Type-led on purpose. No region has been photographed as a region, and a
 * card promising the South Shore over a stock harbour is the thing the brand
 * guidelines forbid.
 */
const MAX_TOWNS = 6;

export function RegionBand({ products }: { products: CollectionProduct[] }) {
  const groups = groupByRegion(groupByTown(products)).filter((g) => g.towns.length > 0);
  if (groups.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-town-navy">
      <BrandPattern variant="topo" color="cream" opacity={0.07} size={260} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-2">
              Shop by region
            </p>
            <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-white">
              Where are you from?
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-block shrink-0 text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/85 hover:text-white transition-colors"
          >
            Every town
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const shown = g.towns.slice(0, MAX_TOWNS);
            const more = g.towns.length - shown.length;
            return (
              <Link
                key={g.region}
                href={regionHref(g.region)}
                className="group flex flex-col rounded-sm border border-town-cream/15 bg-town-cream/[0.04] p-5 sm:p-6 transition-colors hover:bg-town-cream/[0.09] hover:border-town-cream/30"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="font-block font-bold uppercase text-lg sm:text-xl leading-none tracking-[0.015em] text-white">
                    {g.label}
                  </h3>
                  <span className="text-[0.625rem] uppercase tracking-[0.18em] text-town-cream/60">
                    {g.towns.length} {g.towns.length === 1 ? 'town' : 'towns'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-town-cream/80">
                  {shown.map((t) => t.name).join(' · ')}
                  {more > 0 && <span className="text-town-cream/55"> · +{more} more</span>}
                </p>
                <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-town-cream/85 group-hover:text-white transition-colors">
                  <MaMark className="h-2 w-auto text-town-forest" />
                  Shop {g.label}
                </span>
              </Link>
            );
          })}

          <Link
            href="/request-a-town"
            className="group flex flex-col rounded-sm border border-dashed border-town-cream/30 p-5 sm:p-6 transition-colors hover:border-town-cream/60"
          >
            <h3 className="font-block font-bold uppercase text-lg sm:text-xl leading-none tracking-[0.015em] text-white mb-4">
              Your town
            </h3>
            <p className="text-sm leading-relaxed text-town-cream/80">
              Not on the map yet? Every request gets counted, and the loudest towns get made first.
            </p>
            <span className="mt-auto pt-5 inline-flex items-center text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/85 group-hover:text-white transition-colors">
              Request it
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
