'use client';

import { useMemo, useState } from 'react';
import { ProductCard } from './product-card';
import type { CollectionProduct } from '@/lib/shopify/collections';
import type { HatStyle } from '@/lib/townies/towns';
import { cn } from '@/lib/utils';

/**
 * One shop page, filtered region → town, with a style toggle and a sort.
 *
 * REGION FIRST. The filter used to be a single row of town pills, which works
 * at thirteen towns and stops working at forty — and the plan is every town in
 * Massachusetts, filed by region. So the first row is the regions that have
 * product, and the second row is the towns inside the region you picked. A
 * town pill is still one click from the top of the page.
 *
 * Client-side so switching is instant; the choice is mirrored into the URL
 * (?region= &town= &style=) so a filtered view can be shared and deep-linked
 * from the homepage bands and the town finder.
 */
export type ShopItem = {
  product: CollectionProduct;
  slug: string;
  name: string;
  region: string;
  style: HatStyle | null;
};
export type TownTab = { slug: string; name: string; region: string };
export type RegionTab = { slug: string; label: string };

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'az';

const SORTS: Array<{ key: Sort; label: string }> = [
  { key: 'featured', label: 'Featured' },
  { key: 'az', label: 'Town A–Z' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
];

const STYLES: Array<{ key: HatStyle; label: string }> = [
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'everyday', label: 'Everyday' },
];

function priceOf(p: CollectionProduct): number {
  return parseFloat(p.variants.edges[0]?.node.price.amount ?? '0') || 0;
}

export function ShopFilter({
  items,
  towns,
  regions,
  initialTown,
  initialRegion,
  initialStyle,
}: {
  items: ShopItem[];
  towns: TownTab[];
  regions: RegionTab[];
  initialTown?: string;
  initialRegion?: string;
  initialStyle?: string;
}) {
  const startTown = initialTown && towns.some((t) => t.slug === initialTown) ? initialTown : 'all';
  const startRegion =
    startTown !== 'all'
      ? (towns.find((t) => t.slug === startTown)?.region ?? 'all')
      : initialRegion && regions.some((r) => r.slug === initialRegion)
        ? initialRegion
        : 'all';
  const startStyle = STYLES.some((s) => s.key === initialStyle) ? (initialStyle as HatStyle) : 'all';

  const [region, setRegion] = useState<string>(startRegion);
  const [town, setTown] = useState<string>(startTown);
  const [style, setStyle] = useState<HatStyle | 'all'>(startStyle);
  const [sort, setSort] = useState<Sort>('featured');

  function sync(next: { region: string; town: string; style: HatStyle | 'all' }) {
    const q = new URLSearchParams();
    if (next.town !== 'all') q.set('town', next.town);
    else if (next.region !== 'all') q.set('region', next.region);
    if (next.style !== 'all') q.set('style', next.style);
    const qs = q.toString();
    window.history.replaceState(null, '', qs ? `/shop?${qs}` : '/shop');
  }

  function pickRegion(slug: string) {
    setRegion(slug);
    setTown('all');
    sync({ region: slug, town: 'all', style });
  }
  function pickTown(slug: string) {
    setTown(slug);
    sync({ region, town: slug, style });
  }
  function pickStyle(s: HatStyle | 'all') {
    setStyle(s);
    sync({ region, town, style: s });
  }
  function clear() {
    setRegion('all');
    setTown('all');
    setStyle('all');
    sync({ region: 'all', town: 'all', style: 'all' });
  }

  const townsShown = region === 'all' ? towns : towns.filter((t) => t.region === region);

  const shown = useMemo(() => {
    let list = items;
    if (town !== 'all') list = list.filter((i) => i.slug === town);
    else if (region !== 'all') list = list.filter((i) => i.region === region);
    if (style !== 'all') list = list.filter((i) => i.style === style);
    if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name) || a.product.title.localeCompare(b.product.title));
    if (sort === 'price-asc') list = [...list].sort((a, b) => priceOf(a.product) - priceOf(b.product));
    if (sort === 'price-desc') list = [...list].sort((a, b) => priceOf(b.product) - priceOf(a.product));
    return list;
  }, [items, town, region, style, sort]);

  const filtered = region !== 'all' || town !== 'all' || style !== 'all';
  const activeLabel =
    town !== 'all'
      ? towns.find((t) => t.slug === town)?.name
      : region !== 'all'
        ? regions.find((r) => r.slug === region)?.label
        : null;

  return (
    <div>
      {/* Row 1 — regions. Only shown once there is more than one. */}
      {regions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Tab label="All regions" active={region === 'all'} onClick={() => pickRegion('all')} />
          {regions.map((r) => (
            <Tab key={r.slug} label={r.label} active={region === r.slug} onClick={() => pickRegion(r.slug)} />
          ))}
        </div>
      )}

      {/* Row 2 — towns inside the region. */}
      <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tab label="All towns" active={town === 'all'} onClick={() => pickTown('all')} quiet />
        {townsShown.map((t) => (
          <Tab key={t.slug} label={t.name} active={town === t.slug} onClick={() => pickTown(t.slug)} quiet />
        ))}
      </div>

      {/* Ruled control line — sort on the left, the style toggle on the right.
          No result count: it restated the grid below it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule mt-3 pt-3 mb-7">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-muted">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort"
              className="bg-transparent border-b border-rule py-1 pr-1 text-[0.68rem] uppercase tracking-[0.2em] text-text focus:outline-none focus:border-text"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          {filtered && (
            <button
              type="button"
              onClick={clear}
              className="text-[0.68rem] uppercase tracking-[0.2em] text-text hover:text-accent underline underline-offset-4 transition-colors"
            >
              Clear{activeLabel ? ` · ${activeLabel}` : ''}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Hat style">
          <Toggle label="All" active={style === 'all'} onClick={() => pickStyle('all')} />
          {STYLES.map((s) => (
            <Toggle key={s.key} label={s.label} active={style === s.key} onClick={() => pickStyle(s.key)} />
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-muted text-sm py-16">
          Nothing here yet — try another town, or{' '}
          <a href="/request-a-town" className="underline underline-offset-4 hover:text-text">
            request yours
          </a>
          .
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {shown.map((i, idx) => (
            <ProductCard key={i.product.id} product={i.product} priority={idx < 4} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
  quiet,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  /** The town row sits under the region row and reads one step lighter. */
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-full border transition-colors font-semibold uppercase tracking-[0.14em]',
        quiet ? 'px-3.5 py-1.5 text-[0.65rem]' : 'px-4 py-2 text-xs',
        active
          ? 'bg-ink text-ink-contrast border-ink'
          : 'bg-transparent text-text/60 border-rule hover:text-text hover:border-text/40',
      )}
    >
      {label}
    </button>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] border-b-2 transition-colors',
        active ? 'border-text text-text' : 'border-transparent text-muted hover:text-text',
      )}
    >
      {label}
    </button>
  );
}
