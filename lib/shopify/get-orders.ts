import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import { fetchAllOrders, lineBrand, brandRevenue, type ShopifyOrder } from './orders-source';

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

function orderBrand(order: ShopifyOrder): OrderBrand {
  // Pass created_at explicitly — a bare .map(lineBrand) hands it the array
  // index as the date, which parses to NaN and silently reverts every untagged
  // line to the legacy Good Kicks fallback.
  const brands = new Set(
    (order.line_items ?? []).map((li) => lineBrand(li, order.created_at)),
  );
  if (brands.size > 1) return 'mixed';
  return (brands.values().next().value as RealBrand) ?? 'townies';
}

/**
 * Order summary, optionally scoped to one brand.
 * - 'all': every order, revenue = Shopify order total (incl. shipping/tax).
 * - a brand: orders containing ≥1 line item of that brand; revenue = that
 *   brand's net line totals (price × qty, minus each line's share of order
 *   discounts), so a mixed order only contributes its own brand's share.
 *   Per-brand revenue therefore excludes shipping and tax — the same figure rep
 *   commission is calculated from, so the two views agree.
 */
export async function getOrderSummary(brand: AdminBrand = 'all'): Promise<OrderSummary> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return EMPTY;
  }

  const { orders: raw } = await fetchAllOrders();

  const orders: AdminOrder[] = [];
  for (const o of raw) {
    const oBrand = orderBrand(o);
    const matches = brand === 'all' || o.line_items.some((li) => lineBrand(li) === brand);
    if (!matches) continue;

    const total = brand === 'all' ? parseFloat(o.total_price) : brandRevenue(o, brand);

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
