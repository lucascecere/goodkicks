import type { AdminBrand, RealBrand } from '@/lib/admin/brand';

type LineItemProperty = { name: string; value: string };

type ShopifyLineItem = {
  title: string;
  quantity: number;
  price: string;
  properties?: LineItemProperty[];
};

type ShopifyOrder = {
  id: number;
  name: string;
  total_price: string;
  created_at: string;
  financial_status: string;
  discount_codes: { code: string }[];
  line_items: ShopifyLineItem[];
};

export type OrderBrand = RealBrand | 'mixed';

export type AdminOrder = {
  id: string;
  name: string;
  total: number;
  createdAt: string;
  financialStatus: string;
  discountCode: string | null;
  brand: OrderBrand;
};

export type OrderSummary = {
  orders: AdminOrder[];
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
};

const EMPTY: OrderSummary = { orders: [], totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };

// Brand of a single line item. New carts tag each line with a `_brand` custom
// attribute (see components/townies/buy-box.tsx). Legacy orders placed before
// the two-brand cart have no tag → attributed to Good Kicks, the original brand.
function lineBrand(item: ShopifyLineItem): RealBrand {
  const tag = item.properties?.find((p) => p.name === '_brand')?.value;
  return tag === 'townies' ? 'townies' : 'goodkicks';
}

function orderBrand(order: ShopifyOrder): OrderBrand {
  const brands = new Set(order.line_items.map(lineBrand));
  if (brands.size > 1) return 'mixed';
  return (brands.values().next().value as RealBrand) ?? 'goodkicks';
}

/**
 * Order summary, optionally scoped to one brand.
 * - 'all': every order, revenue = Shopify order total (incl. shipping/discounts).
 * - a brand: orders containing ≥1 line item of that brand; revenue = the sum of
 *   THAT brand's line-item subtotals (price × qty), so a mixed order only
 *   contributes its own brand's share. Per-brand revenue therefore excludes
 *   shipping/order-level discounts — a known, acceptable v1 approximation.
 */
export async function getOrderSummary(brand: AdminBrand = 'all'): Promise<OrderSummary> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return EMPTY;
  }

  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/orders.json?status=any&limit=250`;

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('[get-orders] Shopify error', res.status);
    return EMPTY;
  }

  const json = (await res.json()) as { orders?: ShopifyOrder[] };
  const raw = json.orders ?? [];

  const orders: AdminOrder[] = [];
  for (const o of raw) {
    const oBrand = orderBrand(o);
    const matches = brand === 'all' || o.line_items.some((li) => lineBrand(li) === brand);
    if (!matches) continue;

    const total =
      brand === 'all'
        ? parseFloat(o.total_price)
        : o.line_items
            .filter((li) => lineBrand(li) === brand)
            .reduce((sum, li) => sum + parseFloat(li.price) * li.quantity, 0);

    orders.push({
      id: String(o.id),
      name: o.name,
      total,
      createdAt: o.created_at,
      financialStatus: o.financial_status,
      discountCode: o.discount_codes[0]?.code ?? null,
      brand: oBrand,
    });
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return {
    orders,
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
  };
}
