type ShopifyOrder = {
  id: number;
  name: string;
  total_price: string;
  created_at: string;
  financial_status: string;
  discount_codes: { code: string }[];
  line_items: { title: string; quantity: number }[];
};

export type AdminOrder = {
  id: string;
  name: string;
  total: number;
  createdAt: string;
  financialStatus: string;
  discountCode: string | null;
};

export type OrderSummary = {
  orders: AdminOrder[];
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
};

export async function getOrderSummary(): Promise<OrderSummary> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN || !process.env.SHOPIFY_STORE_DOMAIN) {
    return { orders: [], totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
  }

  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/orders.json?status=any&limit=250`;

  const res = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error('[get-orders] Shopify error', res.status);
    return { orders: [], totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
  }

  const json = await res.json() as { orders?: ShopifyOrder[] };
  const raw = json.orders ?? [];

  const orders: AdminOrder[] = raw.map((o) => ({
    id: String(o.id),
    name: o.name,
    total: parseFloat(o.total_price),
    createdAt: o.created_at,
    financialStatus: o.financial_status,
    discountCode: o.discount_codes[0]?.code ?? null,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return {
    orders,
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
  };
}
