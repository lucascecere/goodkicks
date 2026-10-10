import 'server-only';
import { unstable_cache } from 'next/cache';
import { db } from './db';
import type { Product } from './types';
import type { CollectionProduct } from '@/lib/shopify/collections';

// The storefront switch.
//
// With SHOP_STOREFRONT=own, every page that used to read Shopify (shop grid,
// hat pages, town and region pages, Good Kicks, search, sitemap, Hat & Sack)
// reads our own shop_products instead, mapped into the exact shapes those
// components already take. The pages themselves don't change; only where the
// data comes from does. Unset (the default) means Shopify, as before.
//
// Ids: a product's own UUID is used as both product and variant id, so the
// cart, stock caps and checkout all key on it.

export function storefrontOwn(): boolean {
  return process.env.SHOP_STOREFRONT === 'own';
}

const TAG = 'shop-catalog';

/** Every house (Townies + Good Kicks) product that can appear on the storefront. */
const houseProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const { data: house } = await db().from('shop_sellers').select('id').eq('slug', 'townies').maybeSingle();
    if (!house) return [];
    const { data, error } = await db()
      .from('shop_products')
      .select('*')
      .eq('seller_id', house.id)
      .neq('kind', 'internal')
      .order('sort')
      .order('title');
    if (error) throw new Error(`catalog: ${error.message}`);
    return (data ?? []) as Product[];
  },
  ['shop-house-products-v1'],
  { revalidate: 60, tags: [TAG] },
);

/** On hand for a tracked, non-pre-order product; null when the count doesn't apply. */
export function stockOf(p: Product): number | null {
  if (p.preorder || !p.track_stock) return null;
  return Math.max(0, p.on_hand);
}

function available(p: Product): boolean {
  if (p.status !== 'active' || !p.price_cents) return false;
  const s = stockOf(p);
  return s === null || s > 0;
}

function images(p: Product): string[] {
  const list = p.images?.length ? p.images : p.image_url ? [p.image_url] : [];
  return list.filter(Boolean);
}

function price(p: Product) {
  return { amount: ((p.price_cents ?? 0) / 100).toFixed(2), currencyCode: 'USD' };
}

export function toCollectionProduct(p: Product): CollectionProduct {
  const imgs = images(p);
  return {
    id: p.id,
    title: p.title,
    handle: p.slug,
    tags: p.tags ?? [],
    featuredImage: imgs[0] ? { url: imgs[0], altText: p.title } : null,
    images: { edges: imgs.slice(0, 3).map((url) => ({ node: { url, altText: p.title } })) },
    variants: { edges: [{ node: { id: p.id, availableForSale: available(p), price: price(p) } }] },
    stock: stockOf(p),
  };
}

/** The PDP shape lib/shopify/service.ts getProductByHandle returns. */
export function toPdpProduct(p: Product) {
  const imgs = images(p);
  return {
    id: p.id,
    title: p.title,
    handle: p.slug,
    tags: p.tags ?? [],
    descriptionHtml: p.description_html ?? (p.description ? `<p>${escapeHtml(p.description)}</p>` : ''),
    seo: { title: p.seo_title, description: p.seo_description },
    featuredImage: imgs[0] ? { url: imgs[0], altText: p.title, width: 1600, height: 1600 } : null,
    images: { edges: imgs.map((url) => ({ node: { url, altText: p.title, width: 1600, height: 1600 } })) },
    variants: {
      edges: [{ node: { id: p.id, title: 'Default Title', availableForSale: available(p), price: price(p) } }],
    },
  };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const GK_COLLECTION = process.env.SHOPIFY_GOODKICKS_COLLECTION || 'the-good-kicks-v1';
const TOWNIES_COLLECTION = process.env.SHOPIFY_TOWNIES_COLLECTION || 'townies';

/**
 * A Shopify collection handle, answered from our own catalog:
 * - the Good Kicks collection → active foot bags + the 3-Pack
 * - the Townies collection → active town hats
 * - a region handle (south-shore, boston…) → that region's town hats
 * Hat & Sack is in none of them, as on Shopify.
 */
export async function ownCollection(handle: string): Promise<CollectionProduct[]> {
  const all = (await houseProducts()).filter((p) => p.status === 'active' && p.price_cents);
  let picked: Product[];
  if (handle === GK_COLLECTION) picked = all.filter((p) => p.brand === 'goodkicks');
  else if (handle === TOWNIES_COLLECTION) picked = all.filter((p) => p.brand === 'townies' && p.kind === 'hat');
  else picked = all.filter((p) => p.brand === 'townies' && p.kind === 'hat' && p.region === handle);
  return picked.map(toCollectionProduct);
}

export async function ownProductByHandle(handle: string) {
  const p = (await houseProducts()).find((x) => x.slug === handle && x.status === 'active');
  return p ? toPdpProduct(p) : null;
}

/** getAllProducts(): the 3-Pack builder lists the foot-bag colorways from this. */
export async function ownAllProducts(): Promise<CollectionProduct[]> {
  return (await houseProducts()).filter((p) => p.status === 'active' && p.price_cents).map(toCollectionProduct);
}

/** Stock by product id, in the shape lib/shopify/stock.ts returns. */
export async function ownStock(ids: string[]): Promise<Record<string, { quantity: number | null }>> {
  const want = new Set(ids);
  const out: Record<string, { quantity: number | null }> = {};
  for (const p of await houseProducts()) if (want.has(p.id)) out[p.id] = { quantity: stockOf(p) };
  return out;
}

/** House products by id, for checkout (always fresh, never cached). */
export async function houseProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from('shop_products').select('*').in('id', ids);
  if (error) throw new Error(`catalog ids: ${error.message}`);
  return (data ?? []) as Product[];
}

export const CATALOG_TAG = TAG;
