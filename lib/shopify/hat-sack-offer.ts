// The live Hat & Sack offer, read from Shopify.
//
// Every surface that prints the bundle price — the picker, the homepage band,
// the shop masthead, the PDP upsell, the page metadata and the JSON-LD — reads
// it from here, so REPRICING THE BUNDLE IS A SHOPIFY-ADMIN ACTION, NOT A DEPLOY.
// That matters because the price is already scheduled to move (hats $30 → $35 at
// the end of September 2026 takes the bundle to $40). Two sources of truth would
// mean the site quoting the old price while Shopify charges the new one.
//
// Same 60s window as the collection reads, so a price change shows up in about a
// minute. Note Vercel's data cache persists across deployments — a redeploy will
// NOT refresh this on its own, the window will.

import {
  HAT_SACK_HANDLE,
  HAT_SACK_PRICE_FALLBACK_CENTS,
  HAT_SACK_VARIANT_TITLE,
  SACK_POOL,
  SACK_VALUE_FALLBACK_CENTS,
  bundleFromCents,
  eligibleHats,
  eligibleSacks,
} from '@/lib/townies/hat-sack';
import { getProductsByCollection, getTownieProducts, GOODKICKS_COLLECTION, type CollectionProduct } from './collections';
import { storefrontOwn } from '@/lib/shop/catalog';
import { db } from '@/lib/shop/db';

export type TierVariant = { id: string | null; cents: number };

export type HatSackOffer = {
  /** The standard ($40) tier: what "the bundle price" means in copy. */
  priceCents: number;
  /** Every tier, keyed by bundleTier(). */
  tiers: Record<'everyday' | 'standard' | 'titletown', TierVariant>;
  /** Cheapest bag in the draw pool — understates the saving rather than overstating it. */
  sackValueCents: number;
  shipsNowId: string | null;
  preorderId: string | null;
  imageUrl: string | null;
};

const OFFER_QUERY = `
  query HatSackOffer($handle: String!) {
    product(handle: $handle) {
      featuredImage { url }
      variants(first: 10) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount }
          }
        }
      }
    }
  }
`;

type VariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string };
};

function toCents(amount: string | undefined): number | null {
  if (!amount) return null;
  const n = Math.round(parseFloat(amount) * 100);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * `strict` (the /hat-and-sack page): retry once, then THROW rather than return
 * the fallback, whose tiers carry no variant ids and would read as "between
 * restocks". Everyone else gets the quiet fallback.
 */
export async function getHatSackOffer(opts: { strict?: boolean } = {}): Promise<HatSackOffer> {
  const fallback: HatSackOffer = {
    priceCents: HAT_SACK_PRICE_FALLBACK_CENTS,
    tiers: {
      everyday: { id: null, cents: HAT_SACK_PRICE_FALLBACK_CENTS - 500 },
      standard: { id: null, cents: HAT_SACK_PRICE_FALLBACK_CENTS },
      titletown: { id: null, cents: HAT_SACK_PRICE_FALLBACK_CENTS + 500 },
    },
    sackValueCents: SACK_VALUE_FALLBACK_CENTS,
    shipsNowId: null,
    preorderId: null,
    imageUrl: null,
  };

  // Storefront switch: tiers and the bundle photo come from our own data.
  if (storefrontOwn()) {
    try {
      return await ownHatSackOffer(fallback);
    } catch (err) {
      console.error('[hat-sack-offer] own offer failed:', err);
      if (opts.strict) throw err;
      return fallback;
    }
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return fallback;

  const read = async (fresh: boolean): Promise<HatSackOffer> => {
    const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: OFFER_QUERY, variables: { handle: HAT_SACK_HANDLE } }),
      signal: AbortSignal.timeout(8000),
      // The retry skips the data cache so a failed answer isn't served again.
      ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 60, tags: ['shopify-collections'] } }),
    });
    if (!res.ok) throw new Error(`Storefront ${res.status}`);
    const json = await res.json();
    if (json?.errors) throw new Error(JSON.stringify(json.errors));
    const product = json?.data?.product;
    if (!product) throw new Error('hat-and-sack product not returned');

    const nodes: VariantNode[] =
      product.variants?.edges?.map((e: { node: VariantNode }) => e.node) ?? [];
    const byTitle = (t: string) => nodes.find((n) => n.title === t) ?? null;
    const shipsNow = byTitle(HAT_SACK_VARIANT_TITLE.shipsNow);
    const preorder = byTitle(HAT_SACK_VARIANT_TITLE.preorder);

    // Both variants are the same price by design; take whichever answered.
    const priceCents =
      toCents(shipsNow?.price.amount) ??
      toCents(preorder?.price.amount) ??
      HAT_SACK_PRICE_FALLBACK_CENTS;

    const tier = (t: string, fb: number): TierVariant => {
      const n = byTitle(t);
      return { id: n?.availableForSale ? n.id : null, cents: toCents(n?.price.amount) ?? fb };
    };
    return {
      priceCents,
      tiers: {
        everyday: tier(HAT_SACK_VARIANT_TITLE.everyday, priceCents - 500),
        standard: { id: shipsNow?.availableForSale ? shipsNow.id : null, cents: priceCents },
        titletown: tier(HAT_SACK_VARIANT_TITLE.titletown, priceCents + 500),
      },
      sackValueCents: await poolFloorCents(),
      // Only sell a variant that is actually purchasable.
      shipsNowId: shipsNow?.availableForSale ? shipsNow.id : null,
      preorderId: preorder?.availableForSale ? preorder.id : null,
      imageUrl: product.featuredImage?.url ?? null,
    };
  };

  try {
    try {
      return await read(false);
    } catch (err) {
      console.error('[hat-sack-offer] read failed, retrying:', err);
      return await read(true);
    }
  } catch (err) {
    console.error('[hat-sack-offer] threw:', err);
    if (opts.strict) throw err;
    return fallback;
  }
}

/**
 * Own-engine offer. Tier ids are synthetic (`hatsack:<tier>`): checkout
 * re-derives the tier from the hat and bag actually picked, so the id only
 * says "this line is a Hat & Sack". Prices come from shop_settings
 * (hat_sack_tiers, written by the Shopify import and editable later).
 */
async function ownHatSackOffer(fallback: HatSackOffer): Promise<HatSackOffer> {
  const [{ data: setting }, { data: bundle }] = await Promise.all([
    db().from('shop_settings').select('value').eq('key', 'hat_sack_tiers').maybeSingle(),
    db().from('shop_products').select('image_url, status').eq('slug', HAT_SACK_HANDLE).maybeSingle(),
  ]);
  const t = setting?.value ? (JSON.parse(setting.value) as Partial<Record<'standard' | 'everyday' | 'titletown', number | null>>) : {};
  const standard = t.standard ?? fallback.tiers.standard.cents;
  const live = bundle?.status === 'active';
  const tier = (key: 'standard' | 'everyday' | 'titletown', cents: number): TierVariant => ({ id: live ? `hatsack:${key}` : null, cents });
  return {
    priceCents: standard,
    tiers: {
      everyday: tier('everyday', t.everyday ?? standard - 500),
      standard: tier('standard', standard),
      titletown: tier('titletown', t.titletown ?? standard + 500),
    },
    sackValueCents: await poolFloorCents(),
    shipsNowId: live ? 'hatsack:standard' : null,
    preorderId: null,
    imageUrl: bundle?.image_url ?? null,
  };
}

/**
 * The "From $X" every promo surface prints: the cheapest tier that is really
 * purchasable over today's in-stock hats × bags (see bundleFromCents). Best
 * effort; an unreadable shelf falls back to the lowest tier price. Also hands
 * back the eligible hats, so a promo can picture one that's actually in stock.
 */
export async function getHatSackShelf(offer?: HatSackOffer): Promise<{ fromCents: number; hats: CollectionProduct[] }> {
  const [o, townies, gk] = await Promise.all([
    offer ?? getHatSackOffer(),
    getTownieProducts(),
    getProductsByCollection(GOODKICKS_COLLECTION),
  ]);
  const hats = eligibleHats(townies);
  return { fromCents: bundleFromCents(o.tiers, hats, eligibleSacks(gk)), hats };
}

export async function getHatSackFromCents(offer?: HatSackOffer): Promise<number> {
  return (await getHatSackShelf(offer)).fromCents;
}

/** Cheapest bag in the pool, from the live Good Kicks collection. */
async function poolFloorCents(): Promise<number> {
  try {
    const gk = await getProductsByCollection(GOODKICKS_COLLECTION);
    const handles = new Set<string>(SACK_POOL.map((b) => b.handle));
    const prices = gk
      .filter((p) => handles.has(p.handle))
      .map((p) => toCents(p.variants.edges[0]?.node.price.amount))
      .filter((c): c is number => c !== null);
    return prices.length ? Math.min(...prices) : SACK_VALUE_FALLBACK_CENTS;
  } catch {
    return SACK_VALUE_FALLBACK_CENTS;
  }
}
