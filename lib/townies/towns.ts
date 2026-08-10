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
  'south-east': 'Southeastern Mass',
  'boston': 'Boston',
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

/**
 * Real Massachusetts region for each town, by town slug.
 *
 * This exists because region used to come from Shopify tags alone, defaulting
 * to South Shore when a product had none — so every untagged town silently
 * claimed the South Shore, and Boston neighbourhoods and Southeastern Mass
 * towns turned up on /south-shore. Geography is a fact about the town, not
 * about whether someone remembered to tag a product, so it lives in code.
 *
 * An explicit region tag in Shopify still wins, so a one-off can be overridden
 * without a deploy.
 */
const TOWN_REGION: Record<string, string> = {
  // Boston — neighbourhoods, not suburbs.
  'west-roxbury': 'boston', roslindale: 'boston', dorchester: 'boston',
  'south-boston': 'boston', southie: 'boston', charlestown: 'boston',
  'jamaica-plain': 'boston', 'hyde-park': 'boston', mattapan: 'boston',
  brighton: 'boston', allston: 'boston', 'east-boston': 'boston',
  roxbury: 'boston', 'north-end': 'boston',

  // South Shore.
  milton: 'south-shore', quincy: 'south-shore', braintree: 'south-shore',
  weymouth: 'south-shore', hingham: 'south-shore', cohasset: 'south-shore',
  scituate: 'south-shore', marshfield: 'south-shore', duxbury: 'south-shore',
  norwell: 'south-shore', hanover: 'south-shore', rockland: 'south-shore',
  abington: 'south-shore', whitman: 'south-shore', hanson: 'south-shore',
  pembroke: 'south-shore', kingston: 'south-shore', plymouth: 'south-shore',
  hull: 'south-shore', holbrook: 'south-shore', randolph: 'south-shore',

  // Southeastern Mass — Bristol County and the Taunton/Brockton side.
  norton: 'south-east', mansfield: 'south-east', foxboro: 'south-east',
  foxborough: 'south-east', attleboro: 'south-east',
  'north-attleborough': 'south-east', taunton: 'south-east',
  raynham: 'south-east', easton: 'south-east', brockton: 'south-east',
  bridgewater: 'south-east', 'east-bridgewater': 'south-east',
  'west-bridgewater': 'south-east', middleboro: 'south-east',
  middleborough: 'south-east', lakeville: 'south-east', berkley: 'south-east',
  dighton: 'south-east', rehoboth: 'south-east', seekonk: 'south-east',
  swansea: 'south-east', somerset: 'south-east', 'fall-river': 'south-east',
  'new-bedford': 'south-east', dartmouth: 'south-east', westport: 'south-east',
  fairhaven: 'south-east', acushnet: 'south-east', freetown: 'south-east',

  // North Shore.
  salem: 'north-shore', beverly: 'north-shore', marblehead: 'north-shore',
  swampscott: 'north-shore', lynn: 'north-shore', nahant: 'north-shore',
  saugus: 'north-shore', peabody: 'north-shore', danvers: 'north-shore',
  gloucester: 'north-shore', rockport: 'north-shore', essex: 'north-shore',
  ipswich: 'north-shore', hamilton: 'north-shore', wenham: 'north-shore',
  topsfield: 'north-shore', newburyport: 'north-shore', amesbury: 'north-shore',
  salisbury: 'north-shore', rowley: 'north-shore', georgetown: 'north-shore',
  middleton: 'north-shore', lynnfield: 'north-shore', 'manchester-by-the-sea': 'north-shore',

  // Cape Cod.
  barnstable: 'cape-cod', hyannis: 'cape-cod', falmouth: 'cape-cod',
  sandwich: 'cape-cod', bourne: 'cape-cod', mashpee: 'cape-cod',
  yarmouth: 'cape-cod', dennis: 'cape-cod', brewster: 'cape-cod',
  harwich: 'cape-cod', chatham: 'cape-cod', orleans: 'cape-cod',
  eastham: 'cape-cod', wellfleet: 'cape-cod', truro: 'cape-cod',
  provincetown: 'cape-cod',
};

/**
 * Region for a product: explicit Shopify tag first, then the town map.
 *
 * Falls back to `other` ("More Towns"), NOT to South Shore. An unrecognised
 * town showing up under More Towns is a visible prompt to add it here; one
 * silently filed under South Shore is a bug nobody sees.
 */
function regionForProduct(tags: string[], townSlug: string): string {
  const tagged = tags.find((t) => REGION_LABELS[t.toLowerCase()]);
  if (tagged) return tagged.toLowerCase();
  return TOWN_REGION[townSlug] ?? OTHER_REGION;
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
  const region = regionForProduct(product.tags, townKey(product).slug);
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
// Curated lifestyle photo per town, so a town card never falls back to a
// white product shot (which reads wrong next to the lifestyle cards).
// Milton/Braintree use their real hat-drop photos; the rest use town photography
// until each town has its own drop shot.
const TOWN_IMAGES: Record<string, string> = {
  milton: '/brand/drops/milton.jpg',
  braintree: '/brand/drops/braintree.jpg',
  hingham: '/brand/lifestyle/town-hingham.jpg',
  scituate: '/brand/lifestyle/town-scituate.jpg',
  marshfield: '/brand/lifestyle/town-marshfield.jpg',
  weymouth: '/brand/lifestyle/town-weymouth.jpg',
  hanover: '/brand/lifestyle/town-hanover.jpg',
  cohasset: '/brand/lifestyle/town-cohasset.jpg',
  norwell: '/brand/lifestyle/town-norwell.jpg',
  duxbury: '/brand/lifestyle/town-duxbury.jpg',
};

export function townKey(p: CollectionProduct): { slug: string; name: string } {
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
    const region = regionForProduct(withImage.tags, slug);
    towns.push({
      id: `town-${slug}`,
      name,
      handle: '',
      href: `/shop?town=${slug}`,
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

/**
 * Products belonging to a region, using the same resolution as everything else
 * (tag → town map → other).
 *
 * Deliberately returns an EMPTY array when a region has nothing. The region
 * pages used to fall back to the whole catalogue when their tag filter came up
 * empty, which is why /south-shore was listing Boston and Southeastern Mass
 * hats — an empty state is correct; showing the wrong towns is not.
 */
export function productsInRegion(
  products: CollectionProduct[],
  region: string,
): CollectionProduct[] {
  return products.filter((p) => regionForProduct(p.tags, townKey(p).slug) === region);
}
