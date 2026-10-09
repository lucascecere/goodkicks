// Live on-hand counts for the cart drawer, so a shopper can't step a hat past
// what's on the shelf ("only 5 left" with 7 in the bag). Same cached Admin read
// as the PDP (lib/shopify/stock.ts): a number only for tracked, stop-at-zero
// (DENY) variants; pre-orders and everything else come back null = uncapped.

import type { NextRequest } from 'next/server';
import { getVariantStock } from '@/lib/shopify/stock';

export const dynamic = 'force-dynamic';

const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

export async function GET(req: NextRequest) {
  const ids = [...new Set((req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => VARIANT_GID.test(id)))]
    .sort()
    .slice(0, 50);
  const stock = ids.length ? await getVariantStock(ids) : {};
  const out: Record<string, number | null> = {};
  for (const id of ids) out[id] = stock[id]?.quantity ?? null;
  return Response.json({ stock: out }, { headers: { 'Cache-Control': 'no-store' } });
}
