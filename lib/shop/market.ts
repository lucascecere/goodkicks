import 'server-only';
import { listProducts, listSellers } from './db';
import type { Product, Seller } from './types';

// What the public market shows: live local businesses that have at least one
// hat priced and on sale. A business with nothing to sell yet stays hidden,
// so a shopper never opens an empty stall.

export type Stall = { seller: Seller; hats: Product[] };

export async function getStalls(): Promise<Stall[]> {
  const [sellers, products] = await Promise.all([listSellers({ liveOnly: true }), listProducts(undefined, { activeOnly: true })]);
  const bySeller = new Map<string, Product[]>();
  for (const p of products) {
    const list = bySeller.get(p.seller_id) ?? [];
    list.push(p);
    bySeller.set(p.seller_id, list);
  }
  return sellers
    .map((seller) => ({ seller, hats: bySeller.get(seller.id) ?? [] }))
    .filter((s) => s.hats.length > 0);
}

export async function getStall(slug: string): Promise<Stall | null> {
  const stalls = await getStalls();
  return stalls.find((s) => s.seller.slug === slug) ?? null;
}

/** Towns that have at least one stall, A to Z. */
export function townsOf(stalls: Stall[]): string[] {
  return [...new Set(stalls.map((s) => s.seller.town).filter((t): t is string => Boolean(t)))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function townSlug(town: string): string {
  return town.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
