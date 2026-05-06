export type AmbassadorOrder = {
  id: string;
  name: string;
  amount: number;
  createdAt: string;
};

export type AmbassadorStats = {
  orders: AmbassadorOrder[];
  totalOrders: number;
  totalRevenue: number;
  commissionEarned: number;
  hasMore: boolean;
};

type ShopifyRestOrder = {
  id: number;
  name: string;
  total_price: string;
  created_at: string;
  discount_codes: { code: string; amount: string; type: string }[];
};

export async function getAmbassadorStats(
  discountCode: string,
  tierPct: number
): Promise<AmbassadorStats> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return { orders: [], totalOrders: 0, totalRevenue: 0, commissionEarned: 0, hasMore: false };
  }

  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/orders.json?discount_code=${encodeURIComponent(discountCode)}&status=any&limit=250`;

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error('[ambassador-stats] Shopify REST error', res.status, await res.text());
    return { orders: [], totalOrders: 0, totalRevenue: 0, commissionEarned: 0, hasMore: false };
  }

  const json = await res.json() as { orders?: ShopifyRestOrder[] };

  if (!json.orders) {
    console.error('[ambassador-stats] unexpected response', JSON.stringify(json));
    return { orders: [], totalOrders: 0, totalRevenue: 0, commissionEarned: 0, hasMore: false };
  }

  const orders: AmbassadorOrder[] = json.orders.map((o) => ({
    id: String(o.id),
    name: o.name,
    amount: parseFloat(o.total_price),
    createdAt: o.created_at,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const commissionEarned = totalRevenue * (tierPct / 100);

  return {
    orders,
    totalOrders: orders.length,
    totalRevenue,
    commissionEarned,
    hasMore: orders.length === 250,
  };
}
