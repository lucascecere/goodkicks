import type { CollectionProduct } from '@/lib/shopify/collections';
import { hatStyle } from '@/lib/townies/towns';
import { isPreorder } from '@/lib/townies/preorder';

/**
 * The v2 storefront, modelled on melin.com: every hat sits on the same warm
 * studio ground. The Shopify shots are hats on a white sweep, so
 * `mix-blend-multiply` drops the white out and the tile colour shows through —
 * one consistent studio look with no re-shoot and no generated photography.
 */
export const STUDIO_TILE = 'bg-[#F1EEE8]';
export const STUDIO_IMG = 'mix-blend-multiply';

export function price(p: CollectionProduct): string {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2)}` : '';
}

/** "Lifestyle snapback" / "Everyday snapback" — the line under the name. */
export function styleLine(p: CollectionProduct): string {
  const s = hatStyle(p.title);
  if (s === 'lifestyle') return 'Lifestyle snapback · two-tone';
  if (s === 'everyday') return 'Everyday snapback · solid';
  return 'Snapback';
}

/** Second distinct gallery image (the front view on most hats), or null. */
export function altImage(p: CollectionProduct) {
  const featured = p.featuredImage?.url;
  return p.images?.edges?.map((e) => e.node).find((i) => i.url !== featured) ?? null;
}

export type Badge = { label: string; tone: 'dark' | 'light' } | null;

/** Same availability rules as ProductCard (CONTINUE-policy trap included). */
export function badge(p: CollectionProduct): Badge {
  const preorder = isPreorder(p.tags);
  if (preorder) return { label: 'Pre-order', tone: 'light' };
  const outOfStock = typeof p.stock === 'number' && p.stock <= 0;
  const available = (p.variants.edges[0]?.node.availableForSale ?? false) && !outOfStock;
  if (!available) return { label: 'Sold out', tone: 'dark' };
  return null;
}
