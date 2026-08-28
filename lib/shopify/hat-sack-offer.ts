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
} from '@/lib/townies/hat-sack';
import { getProductsByCollection, GOODKICKS_COLLECTION } from './collections';

export type HatSackOffer = {
  priceCents: number;
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

export async function getHatSackOffer(): Promise<HatSackOffer> {
  const fallback: HatSackOffer = {
    priceCents: HAT_SACK_PRICE_FALLBACK_CENTS,
    sackValueCents: SACK_VALUE_FALLBACK_CENTS,
    shipsNowId: null,
    preorderId: null,
    imageUrl: null,
  };

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return fallback;

  try {
    const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: OFFER_QUERY, variables: { handle: HAT_SACK_HANDLE } }),
      next: { revalidate: 60, tags: ['shopify-collections'] },
    });
    const json = await res.json();
    if (json?.errors) {
      console.error('[hat-sack-offer]', JSON.stringify(json.errors));
      return fallback;
    }
    const product = json?.data?.product;
    if (!product) return fallback;

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

    return {
      priceCents,
      sackValueCents: await poolFloorCents(),
      // Only sell a variant that is actually purchasable.
      shipsNowId: shipsNow?.availableForSale ? shipsNow.id : null,
      preorderId: preorder?.availableForSale ? preorder.id : null,
      imageUrl: product.featuredImage?.url ?? null,
    };
  } catch (err) {
    console.error('[hat-sack-offer] threw:', err);
    return fallback;
  }
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
