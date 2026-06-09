import { createSupabaseServiceClient } from '@/lib/supabase/client';

export type AmbassadorOrder = {
  id: string;
  name: string;
  revenue: number;
  profit: number;
  createdAt: string;
};

export type AmbassadorStats = {
  orders: AmbassadorOrder[];
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  commissionEarned: number;
  hasMore: boolean;
};

type ShopifyLineItem = {
  title: string;
  quantity: number;
  price: string;
};

type ShopifyRestOrder = {
  id: number;
  name: string;
  total_price: string;
  created_at: string;
  discount_codes: { code: string; amount: string; type: string }[];
  line_items: ShopifyLineItem[];
};

async function fetchAllOrders(token: string, domain: string): Promise<ShopifyRestOrder[]> {
  const all: ShopifyRestOrder[] = [];
  let url: string | null = `https://${domain}/admin/api/2024-10/orders.json?status=any&limit=250`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[ambassador-stats] Shopify error', response.status);
      break;
    }

    const json = await response.json() as { orders?: ShopifyRestOrder[] };
    all.push(...(json.orders ?? []));

    const link = response.headers.get('Link') ?? '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    url = next;
  }

  return all;
}

const DEFAULT_UNIT_COST = 4.5;

async function getUnitCost(): Promise<number> {
  try {
    const supabase = createSupabaseServiceClient();
    const { data } = await supabase
      .from('product_costs')
      .select('unit_cost')
      .eq('product_title', 'Good Kicks Foot Bag')
      .single();
    return typeof data?.unit_cost === 'number' ? data.unit_cost : DEFAULT_UNIT_COST;
  } catch {
    return DEFAULT_UNIT_COST;
  }
}

function calcOrderProfit(order: ShopifyRestOrder, unitCost: number): number {
  const revenue = parseFloat(order.total_price);
  const totalUnits = order.line_items.reduce((sum, item) => sum + item.quantity, 0);
  return Math.max(0, revenue - unitCost * totalUnits);
}

export async function getAmbassadorStats(
  discountCode: string,
  tierPct: number
): Promise<AmbassadorStats> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return { orders: [], totalOrders: 0, totalRevenue: 0, totalProfit: 0, commissionEarned: 0, hasMore: false };
  }

  const [allOrders, unitCost] = await Promise.all([
    fetchAllOrders(process.env.SHOPIFY_ADMIN_API_TOKEN, process.env.SHOPIFY_STORE_DOMAIN),
    getUnitCost(),
  ]);

  const upper = discountCode.toUpperCase();
  const matched = allOrders.filter((o) =>
    o.discount_codes.some((d) => d.code.toUpperCase() === upper)
  );

  const orders: AmbassadorOrder[] = matched.map((o) => {
    const revenue = parseFloat(o.total_price);
    const profit = calcOrderProfit(o, unitCost);
    return { id: String(o.id), name: o.name, revenue, profit, createdAt: o.created_at };
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.revenue, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);
  const commissionEarned = totalProfit * (tierPct / 100);

  return { orders, totalOrders: orders.length, totalRevenue, totalProfit, commissionEarned, hasMore: false };
}
