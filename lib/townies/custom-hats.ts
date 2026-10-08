import type { CollectionProduct } from '@/lib/shopify/collections';
import { regionForProduct, regionLabel, townPages, type TownPage } from '@/lib/townies/towns';
import { LIVE_TOWN_SLUGS, NOT_A_TOWN, TOWN_FACTS } from '@/lib/townies/town-facts';

// The facts the custom-hats pages are allowed to state. Taken from the bulk
// band on the home page; change them there and here together.
export const CUSTOM_MIN = 25;
export const CUSTOM_MAX = 200;
export const CUSTOM_QUOTE_WINDOW = 'two business days';

export const CUSTOM_HUB = '/custom-hats';
export const CUSTOM_BUILDER = '/custom-hats/build';

export function customTownHref(slug: string): string {
  return `${CUSTOM_HUB}/${slug}`;
}

/** Whether a catalogue town gets a /custom-hats/<slug> page. */
export function hasCustomPage(slug: string): boolean {
  return !NOT_A_TOWN.has(slug);
}

/**
 * Every town with a custom-hats page: the towns we actually sell, from the
 * catalogue. When the catalogue is empty (local dev, Shopify down at build)
 * it falls back to the towns live in October 2026, so the pages still exist.
 */
export function customTowns(products: CollectionProduct[]): TownPage[] {
  const live = townPages(products).filter((t) => hasCustomPage(t.slug));
  if (live.length > 0) return live;
  return LIVE_TOWN_SLUGS.map((slug) => {
    const region = regionForProduct([], slug);
    return {
      slug,
      name: TOWN_FACTS[slug]?.name ?? slug,
      region,
      regionLabel: regionLabel(region),
      products: [],
    };
  });
}
