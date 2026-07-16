import type { CollectionProduct } from '@/lib/shopify/collections';

// Town view model + region grouping.
//
// Each TOWN is a Shopify product in the townies collection (title = town name).
// Region is driven by a product tag (e.g. `south-shore`) so adding a town or a
// whole new region needs ZERO code — just a product + tag in Shopify.

export type TownView = {
  id: string;
  name: string; // town name — the hero
  handle: string;
  href?: string; // explicit link target (grouped towns → the shop)
  region: string; // raw region tag, e.g. "south-shore"
  regionLabel: string; // display label, e.g. "South Shore"
  image: string | null;
  imageAlt: string;
  price: string | null; // formatted, e.g. "$32"
  variantId: string | null;
  priceInCents: number | null;
  available: boolean;
  isPlaceholder?: boolean;
};

// Known regions → display label + sort order. Unknown tags still work (we
// title-case them), so a new region just needs a tag in Shopify.
const REGION_LABELS: Record<string, string> = {
  'south-shore': 'South Shore',
  'north-shore': 'North Shore',
  'cape-cod': 'Cape Cod',
  'metro-west': 'MetroWest',
  'central-mass': 'Central Mass',
  'western-mass': 'Western Mass',
  'greater-boston': 'Greater Boston',
};

const REGION_ORDER = Object.keys(REGION_LABELS);
const OTHER_REGION = 'other';

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function regionFromTags(tags: string[]): string {
  // Prefer a known region tag; otherwise default to South Shore (the launch
  // region) rather than a random tag. Tag products `north-shore` etc. to move them.
  const known = tags.find((t) => REGION_LABELS[t.toLowerCase()]);
  return known ? known.toLowerCase() : 'south-shore';
}

function regionLabel(region: string): string {
  return REGION_LABELS[region] ?? (region === OTHER_REGION ? 'More Towns' : titleCase(region));
}

function formatPrice(amount: string): string {
  const n = parseFloat(amount);
  if (!Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function toTownView(product: CollectionProduct): TownView {
  const variant = product.variants.edges[0]?.node ?? null;
  const region = regionFromTags(product.tags);
  return {
    id: product.id,
    name: product.title,
    handle: product.handle,
    region,
    regionLabel: regionLabel(region),
    image: product.featuredImage?.url ?? null,
    imageAlt: product.featuredImage?.altText ?? `${product.title} — Townies`,
    price: variant ? formatPrice(variant.price.amount) : null,
    variantId: variant?.id ?? null,
    priceInCents: variant ? Math.round(parseFloat(variant.price.amount) * 100) : null,
    available: variant?.availableForSale ?? false,
  };
}

// A TOWN can have several products (e.g. two Milton hats). Group them into one
// town card instead of showing each hat as its own "town". Town identity comes
// from a `town:<name>` tag if present, else the first word of the product title
// (our naming convention is "<Town> <style>", e.g. "Milton Classic Snapback").
// Curated lifestyle photo per town (falls back to the product image).
const TOWN_IMAGES: Record<string, string> = {
  milton: '/brand/drops/milton.jpg',
  braintree: '/brand/drops/braintree.jpg',
};

function townKey(p: CollectionProduct): { slug: string; name: string } {
  const tag = p.tags.find((t) => t.toLowerCase().startsWith('town:'));
  if (tag) {
    const slug = tag
      .slice(5)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return { slug, name: titleCase(slug) };
  }
  const first = p.title.trim().split(/\s+/)[0]?.replace(/[^A-Za-z0-9]/g, '') ?? 'town';
  return { slug: first.toLowerCase(), name: first };
}

export function groupByTown(products: CollectionProduct[]): TownView[] {
  const map = new Map<string, { name: string; products: CollectionProduct[] }>();
  for (const p of products) {
    const { slug, name } = townKey(p);
    const entry = map.get(slug) ?? { name, products: [] };
    entry.products.push(p);
    map.set(slug, entry);
  }

  const towns: TownView[] = [];
  for (const [slug, { name, products: ps }] of map) {
    const withImage = ps.find((p) => p.featuredImage?.url) ?? ps[0];
    const region = regionFromTags(withImage.tags);
    towns.push({
      id: `town-${slug}`,
      name,
      handle: '',
      href: '/south-shore',
      region,
      regionLabel: regionLabel(region),
      image: TOWN_IMAGES[slug] ?? withImage.featuredImage?.url ?? null,
      imageAlt: `${name}, Massachusetts — Townies`,
      price: null,
      variantId: null,
      priceInCents: null,
      available: ps.some((p) => p.variants.edges[0]?.node.availableForSale ?? false),
    });
  }

  towns.sort((a, b) => a.name.localeCompare(b.name));
  return towns;
}

export type RegionGroup = { region: string; label: string; towns: TownView[] };

export function groupByRegion(towns: TownView[]): RegionGroup[] {
  const map = new Map<string, TownView[]>();
  for (const town of towns) {
    const arr = map.get(town.region) ?? [];
    arr.push(town);
    map.set(town.region, arr);
  }

  const groups: RegionGroup[] = [];
  for (const [region, list] of map) {
    list.sort((a, b) => a.name.localeCompare(b.name));
    groups.push({ region, label: regionLabel(region), towns: list });
  }

  // Known regions first (in defined order), then unknowns alphabetically, "other" last.
  groups.sort((a, b) => {
    const ai = REGION_ORDER.indexOf(a.region);
    const bi = REGION_ORDER.indexOf(b.region);
    if (a.region === OTHER_REGION) return 1;
    if (b.region === OTHER_REGION) return -1;
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.label.localeCompare(b.label);
  });

  return groups;
}

// Graceful fallback when the townies collection is empty (pre-cutover). These
// render as styled placeholder cards so layouts look complete with no data, and
// they all point at /shop. They disappear automatically once real products exist.
export const PLACEHOLDER_TOWNS: TownView[] = (
  [
    ['Scituate', 'town-scituate'],
    ['Marshfield', 'town-marshfield'],
    ['Hingham', 'town-hingham'],
    ['Weymouth', 'town-weymouth'],
    ['Hanover', 'town-hanover'],
    ['Cohasset', 'town-cohasset'],
    ['Norwell', 'town-norwell'],
    ['Duxbury', 'town-duxbury'],
  ] as const
).map(([name, slug], i) => ({
  id: `placeholder-${i}`,
  name,
  handle: '',
  region: 'south-shore',
  regionLabel: 'South Shore',
  // Real South Shore stand-in photography (swap for product/lifestyle later).
  image: `/brand/lifestyle/${slug}.jpg`,
  imageAlt: `${name}, Massachusetts`,
  price: null,
  variantId: null,
  priceInCents: null,
  available: false,
  isPlaceholder: true,
}));
