const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;

const ORDERS_BY_DISCOUNT_QUERY = `
  query OrdersByDiscount($query: String!) {
    orders(first: 250, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        totalPriceSet { shopMoney { amount } }
        createdAt
        discountCodes
      }
      pageInfo { hasNextPage }
    }
  }
`;

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

export async function getAmbassadorStats(
  discountCode: string,
  tierPct: number
): Promise<AmbassadorStats> {
  if (!process.env.SHOPIFY_ADMIN_API_TOKEN) {
    return { orders: [], totalOrders: 0, totalRevenue: 0, commissionEarned: 0, hasMore: false };
  }

  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN,
    },
    body: JSON.stringify({
      query: ORDERS_BY_DISCOUNT_QUERY,
      variables: { query: `discount_code:${discountCode} status:any` },
    }),
    next: { revalidate: 300 }, // cache 5 min
  });

  const json = await res.json() as {
    data?: {
      orders?: {
        nodes: { id: string; name: string; totalPriceSet: { shopMoney: { amount: string } }; createdAt: string; discountCodes: string[] }[];
        pageInfo: { hasNextPage: boolean };
      };
    };
  };

  const nodes = json.data?.orders?.nodes ?? [];
  const hasMore = json.data?.orders?.pageInfo?.hasNextPage ?? false;

  const orders: AmbassadorOrder[] = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    amount: parseFloat(n.totalPriceSet.shopMoney.amount),
    createdAt: n.createdAt,
  }));

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const commissionEarned = totalRevenue * (tierPct / 100);

  return {
    orders,
    totalOrders: orders.length,
    totalRevenue,
    commissionEarned,
    hasMore,
  };
}
