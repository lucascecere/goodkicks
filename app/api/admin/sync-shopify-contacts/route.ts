import { NextRequest, NextResponse } from 'next/server';
import { upsertContact } from '@/lib/supabase/upsert-contact';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

type ShopifyOrder = {
  email?: string;
  customer?: { first_name?: string; last_name?: string };
};

async function fetchAllShopifyOrders(): Promise<ShopifyOrder[]> {
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!token || !domain) return [];

  const all: ShopifyOrder[] = [];
  let url: string | null =
    `https://${domain}/admin/api/2024-10/orders.json?status=any&limit=250&fields=email,customer`;

  while (url) {
    const response: Response = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token },
      cache: 'no-store',
    });
    if (!response.ok) break;

    const json = await response.json() as { orders?: ShopifyOrder[] };
    all.push(...(json.orders ?? []));

    const link: string = response.headers.get('Link') ?? '';
    const next: string | null = link.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
    url = next;
  }

  return all;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const orders = await fetchAllShopifyOrders();

  let synced = 0;
  for (const order of orders) {
    if (!order.email) continue;
    const name = [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean)
      .join(' ') || undefined;
    await upsertContact({ email: order.email, name, source: 'order' });
    synced++;
  }

  return NextResponse.json({ ok: true, synced });
}
