export type ColorwayCount = { name: string; units: number };

export type BundleTally = {
  bundleTitle: string;
  totalOrders: number;
  totalUnits: number;
  colorways: ColorwayCount[];
};

type LineItemProperty = { name: string; value: string };

type BundleLineItem = {
  title: string;
  quantity: number;
  properties: LineItemProperty[];
};

type ShopifyOrder = {
  id: number;
  line_items: BundleLineItem[];
};

async function fetchAllOrders(token: string, domain: string): Promise<ShopifyOrder[]> {
  const all: ShopifyOrder[] = [];
  let url: string | null =
    `https://${domain}/admin/api/2024-10/orders.json?status=any&limit=250`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token },
      cache: 'no-store',
    });
    if (!res.ok) break;
    const json = await res.json() as { orders?: ShopifyOrder[] };
    all.push(...(json.orders ?? []));
    const link = res.headers.get('Link') ?? '';
    url = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }

  return all;
}

export async function getBundleTally(): Promise<BundleTally[]> {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!token || !domain) return [];

  const orders = await fetchAllOrders(token, domain);

  // keyed by bundle slug ('3-pack', '5-pack', …)
  const map: Record<string, {
    title: string;
    orderIds: Set<number>;
    colorways: Record<string, number>;
  }> = {};

  for (const order of orders) {
    for (const item of order.line_items) {
      // Detect bundle line items by presence of "Selection N" properties
      const selections = item.properties.filter((p) =>
        /^selection\s*\d+$/i.test(p.name)
      );
      if (selections.length === 0) continue;

      const slug = item.title.toLowerCase().includes('5') ? '5-pack' : '3-pack';
      const title = slug === '5-pack' ? 'The 5-Pack' : 'The 3-Pack';

      if (!map[slug]) map[slug] = { title, orderIds: new Set(), colorways: {} };

      map[slug].orderIds.add(order.id);

      for (const sel of selections) {
        const name = sel.value.trim().toLowerCase();
        map[slug].colorways[name] = (map[slug].colorways[name] ?? 0) + item.quantity;
      }
    }
  }

  return Object.values(map).map((entry) => {
    const colorways = Object.entries(entry.colorways)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units);
    return {
      bundleTitle: entry.title,
      totalOrders: entry.orderIds.size,
      totalUnits: colorways.reduce((s, c) => s + c.units, 0),
      colorways,
    };
  });
}
