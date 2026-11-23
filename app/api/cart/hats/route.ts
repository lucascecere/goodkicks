// Which of the bag's variants are hats (Shopify productType "Hats"), so the
// cart drawer can show the two-town deal the same way checkout will apply it.
// 503 when Shopify can't be read: the drawer then falls back to its own guess
// and keeps sending every first-order code (Shopify picks the better deal).

import type { NextRequest } from 'next/server';
import { getHatVariantIds } from '@/lib/shopify/hat-variants';

export const dynamic = 'force-dynamic';

const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

export async function GET(req: NextRequest) {
  const ids = [...new Set((req.nextUrl.searchParams.get('ids') ?? '').split(',').filter((id) => VARIANT_GID.test(id)))]
    .sort()
    .slice(0, 50);
  if (!ids.length) return Response.json({ hats: [] }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const hats = await getHatVariantIds(ids);
    return Response.json({ hats }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[cart/hats] product type read failed:', err);
    return Response.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
