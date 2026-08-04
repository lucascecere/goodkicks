// Sales driven by a rep's discount code.
//
// Commission is REVENUE-based: a straight percentage of what the customer
// actually paid for that brand's items, after the rep's discount. (The previous
// Good Kicks implementation paid on profit via a `product_costs` table that was
// never created in the database, so every calculation silently used a $4.50
// placeholder cost.)
//
// Attribution is brand-scoped: a Townies rep is credited only for Townies line
// items, so a mixed cart splits correctly and a Townies rep is never paid on a
// Good Kicks sale.

import { createSupabaseServiceClient } from '@/lib/supabase/client';
import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import { fetchAllOrders, brandRevenue, type ShopifyOrder } from './orders-source';

export type RepOrder = {
  id: string;
  name: string;
  revenue: number;
  createdAt: string;
};

export type RepStats = {
  orders: RepOrder[];
  totalOrders: number;
  totalRevenue: number;
  commissionEarned: number;
  lastOrderAt: string | null;
  truncated: boolean;
};

export const EMPTY_REP_STATS: RepStats = {
  orders: [],
  totalOrders: 0,
  totalRevenue: 0,
  commissionEarned: 0,
  lastOrderAt: null,
  truncated: false,
};

function orderUsesCode(order: ShopifyOrder, upperCode: string): boolean {
  return order.discount_codes.some((d) => d.code.toUpperCase() === upperCode);
}

function toRepStats(
  matched: ShopifyOrder[],
  brand: RealBrand,
  commissionPct: number,
  truncated: boolean,
): RepStats {
  const orders: RepOrder[] = matched
    .map((o) => ({
      id: String(o.id),
      name: o.name,
      revenue: brandRevenue(o, brand),
      createdAt: o.created_at,
    }))
    // A mixed order that contains none of this brand's items contributes $0 —
    // don't credit the rep with an order they didn't actually drive.
    .filter((o) => o.revenue > 0)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);

  return {
    orders,
    totalOrders: orders.length,
    totalRevenue,
    commissionEarned: totalRevenue * (commissionPct / 100),
    lastOrderAt: orders[0]?.createdAt ?? null,
    truncated,
  };
}

/** Stats for one rep's code. */
export async function getRepStats({
  code,
  commissionPct,
  brand,
}: {
  code: string;
  commissionPct: number;
  brand: RealBrand;
}): Promise<RepStats> {
  if (!code) return EMPTY_REP_STATS;

  const { orders: allOrders, truncated } = await fetchAllOrders();
  const upper = code.toUpperCase();
  const matched = allOrders.filter(
    (o) => !o.cancelled_at && orderUsesCode(o, upper),
  );

  return toRepStats(matched, brand, commissionPct, truncated);
}

export type RepRow = {
  id: string;
  name: string;
  email: string;
  brand: RealBrand;
  discountCode: string;
  discountPct: number;
  commissionPct: number;
  stats: RepStats;
};

/**
 * One row per approved rep with a code, for the admin sales leaderboard.
 * Shares a single cached order fetch across every rep.
 */
export async function getAllRepStats(brand: AdminBrand = 'all'): Promise<RepRow[]> {
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from('ambassador_applications')
    .select('id, name, email, brand, discount_code, discount_pct, commission_pct, tier_pct')
    .eq('approved', true)
    .not('discount_code', 'is', null);

  if (brand !== 'all') query = query.eq('brand', brand);

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error('[get-rep-stats] Supabase error:', error.message);
    return [];
  }

  const { orders: allOrders, truncated } = await fetchAllOrders();

  const rows = data.map((rep) => {
    const repBrand: RealBrand = rep.brand === 'townies' ? 'townies' : 'goodkicks';
    const commissionPct = rep.commission_pct ?? rep.tier_pct ?? 0;
    const upper = String(rep.discount_code).toUpperCase();
    const matched = allOrders.filter((o) => !o.cancelled_at && orderUsesCode(o, upper));

    return {
      id: rep.id as string,
      name: rep.name as string,
      email: rep.email as string,
      brand: repBrand,
      discountCode: upper,
      discountPct: rep.discount_pct ?? 15,
      commissionPct,
      stats: toRepStats(matched, repBrand, commissionPct, truncated),
    };
  });

  return rows.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);
}
