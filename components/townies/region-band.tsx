import { BrandPattern } from './brand-pattern';
import { RegionRail, type RegionCard } from './region-rail';
import { groupByRegion, groupByTown, regionHref } from '@/lib/townies/towns';
import type { CollectionProduct } from '@/lib/shopify/collections';

/**
 * Shop by region.
 *
 * The catalogue is organised by Massachusetts region and will be for good —
 * every town, eventually, filed under its coast or its county. This is the
 * map, as a band: one card per live region carrying its towns, and a last card
 * for the town that isn't here yet, in a single scrolling row.
 *
 * Each card opens with the hats that region actually holds (2026-09-22). Still
 * no place photography: no region has been photographed as a region, and a card
 * promising the South Shore over a stock harbour is the thing the brand
 * guidelines forbid. Product shots promise only the product.
 */
const MAX_TOWNS = 6;

export function RegionBand({ products }: { products: CollectionProduct[] }) {
  const groups = groupByRegion(groupByTown(products)).filter((g) => g.towns.length > 0);
  if (groups.length === 0) return null;

  const cards: RegionCard[] = groups.map((g) => {
    const shown = g.towns.slice(0, MAX_TOWNS).map((t) => t.name).join(' · ');
    const more = g.towns.length - MAX_TOWNS;
    return {
      key: g.region,
      href: regionHref(g.region),
      title: g.label,
      count: `${g.towns.length} ${g.towns.length === 1 ? 'town' : 'towns'}`,
      body: more > 0 ? `${shown} · +${more} more` : shown,
      cta: `Shop ${g.label}`,
      // Up to three real shots from this region. A town with no photo is
      // skipped rather than padded, so the fan is never a grey box.
      images: g.towns
        .filter((t) => t.image)
        .slice(0, 3)
        .map((t) => ({ url: t.image as string, alt: t.imageAlt })),
    };
  });
  cards.push({
    key: 'request',
    href: '/request-a-town',
    title: 'Your town',
    body: 'Not on the map yet? Every request gets counted, and the loudest towns get made first.',
    cta: 'Request it',
    dashed: true,
  });

  return (
    <section className="relative overflow-hidden bg-town-navy">
      <BrandPattern variant="topo" color="cream" opacity={0.07} size={260} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <RegionRail cards={cards} />
      </div>
    </section>
  );
}
