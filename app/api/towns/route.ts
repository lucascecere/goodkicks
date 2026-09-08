import { NextResponse } from 'next/server';
import { getTownieProducts } from '@/lib/shopify/collections';
import { groupByTown } from '@/lib/townies/towns';

export const revalidate = 60;

/**
 * The live town list for the header finder: one row per town with its region.
 * Small, cached for a minute like the collection read behind it, and safe to
 * call from the client.
 */
export async function GET() {
  const products = await getTownieProducts();
  const towns = groupByTown(products).map((t) => ({
    slug: (t.href ?? '').replace('/shop?town=', ''),
    name: t.name,
    region: t.region,
    regionLabel: t.regionLabel,
    href: t.href ?? '/shop',
  }));
  return NextResponse.json(
    { towns },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
