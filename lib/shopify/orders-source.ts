// Single source of truth for Shopify order reads + brand attribution.
//
// Both the admin order summary and the rep sales tracking read from here, so
// there is exactly one definition of "which brand does this line item belong
// to" and one paginated fetch. The fetch is cached for 5 minutes and tagged, so
// a sales leaderboard covering 20 reps is one round trip, not 20 — and the
// "stats update every 5 minutes" line on the rep dashboard is actually true.

import type { RealBrand } from '@/lib/admin/brand';
import { SHOPIFY_ADMIN_API_VERSION } from './admin-graphql';

export type LineItemProperty = { name: string; value: string };

export type ShopifyLineItem = {
  title: string;
  quantity: number;
  /** Pre-discount unit price. NOT what the customer paid — see `lineRevenue`. */
  price: string;
  /** Per-line share of every order discount, including the rep's own code. */
  discount_allocations?: { amount: string }[];
  properties?: LineItemProperty[];
};

export type ShopifyOrder = {
  id: number;
  name: string;
  total_price: string;
  created_at: string;
  financial_status: string;
  cancelled_at?: string | null;
  discount_codes: { code: string; amount?: string; type?: string }[];
  line_items: ShopifyLineItem[];
};

/** Orders are cached this long; also the freshness promised on the rep dashboard. */
export const ORDERS_REVALIDATE_SECONDS = 300;
export const ORDERS_CACHE_TAG = 'shopify-orders';

/** Safety valve so a runaway Link header can't page forever. */
const MAX_PAGES = 20;

/**
 * Brand of a single line item. Carts tag each line with a `_brand` custom
 * attribute (see components/townies/buy-box.tsx). Legacy orders placed before
 * the two-brand cart have no tag → attributed to Good Kicks, the original brand.
 */
export function lineBrand(item: ShopifyLineItem): RealBrand {
  const tag = item.properties?.find((p) => p.name === '_brand')?.value;
  return tag === 'townies' ? 'townies' : 'goodkicks';
}

/**
 * What the customer actually paid for one line: the pre-discount subtotal minus
 * that line's share of every order discount.
 *
 * `line_item.price` is the price BEFORE discounts, so using it alone would pay a
 * rep on the full sticker price rather than the discounted price their own code
 * produced — e.g. a $9.99 item on a 20%-off code shows price 9.99 with a $1.99
 * allocation, and the customer paid $8.00.
 */
export function lineRevenue(item: ShopifyLineItem): number {
  const gross = parseFloat(item.price) * item.quantity;
  const discounts = (item.discount_allocations ?? []).reduce(
    (sum, d) => sum + parseFloat(d.amount),
    0,
  );
  return Math.max(0, gross - discounts);
}

/**
 * Revenue of one order attributable to a brand — that brand's net line totals.
 * Excludes shipping and taxes, which aren't the rep's to earn on.
 */
export function brandRevenue(order: ShopifyOrder, brand: RealBrand): number {
  return order.line_items
    .filter((li) => lineBrand(li) === brand)
    .reduce((sum, li) => sum + lineRevenue(li), 0);
}

export type OrdersPage = { orders: ShopifyOrder[]; truncated: boolean };

/**
 * Every order in the store, following Shopify's cursor pagination.
 * Returns `truncated: true` if we stopped at MAX_PAGES with more available.
 */
export async function fetchAllOrders(): Promise<OrdersPage> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  if (!domain || !token) return { orders: [], truncated: false };

  const all: ShopifyOrder[] = [];
  let url: string | null =
    `https://${domain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/orders.json?status=any&limit=250`;
  let pages = 0;

  while (url) {
    if (pages >= MAX_PAGES) return { orders: all, truncated: true };

    const res: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      next: { revalidate: ORDERS_REVALIDATE_SECONDS, tags: [ORDERS_CACHE_TAG] },
    });

    if (!res.ok) {
      console.error('[orders-source] Shopify error', res.status);
      break;
    }

    const json = (await res.json()) as { orders?: ShopifyOrder[] };
    all.push(...(json.orders ?? []));
    pages += 1;

    const link = res.headers.get('Link') ?? '';
    url = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }

  return { orders: all, truncated: false };
}
