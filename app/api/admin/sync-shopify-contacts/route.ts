// Backfill: pull every Shopify order into the contacts list, brand-tagged.
//
// The webhook (app/api/webhooks/shopify/orders) handles orders from now on;
// this covers everything placed before it existed, and doubles as a repair tool
// if the webhook is ever down. Both write through the same upsertContact, so a
// contact touched by both routes ends up identical.
//
// Safe to run repeatedly — upsert_contact unions sources and brands rather than
// overwriting them.

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { fetchAllOrders, orderBrands, ORDERS_CACHE_TAG } from '@/lib/shopify/orders-source';
import { isAdminSession } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Orders are cached for 5 minutes for the dashboard's sake. A human pressing
  // "Sync" expects current data, so drop the cache first. Next 16 requires the
  // second argument; `expire: 0` means purge now rather than on a schedule.
  revalidateTag(ORDERS_CACHE_TAG, { expire: 0 });

  // Reuses the shared paginated fetch instead of the bespoke one this route
  // used to carry. That old fetch requested `fields=email,customer`, which
  // omitted line_items — so it could never have known the brand.
  const { orders, truncated } = await fetchAllOrders();

  let synced = 0;
  let skipped = 0;
  let brandless = 0;
  const brandCounts: Record<string, number> = {};

  for (const order of orders) {
    if (!order.email) {
      skipped++;
      continue;
    }

    const name =
      [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ') || undefined;

    // A mixed cart tags the person with both brands — one call each, since the
    // RPC unions one brand at a time. An order with no readable line brand is a
    // POS/manual sale in what is now the Townies store; it used to write nothing
    // at all while still counting as synced, which made a partial pass look
    // complete.
    const brands = orderBrands(order);
    const resolved = brands.length > 0 ? brands : (['townies'] as const);
    if (brands.length === 0) brandless++;

    for (const brand of resolved) {
      await upsertContact({ email: order.email, name, source: 'order', brand });
      brandCounts[brand] = (brandCounts[brand] ?? 0) + 1;
    }
    synced++;
  }

  return NextResponse.json({
    ok: true,
    synced,
    skipped,
    brands: brandCounts,
    // Orders that carried no `_brand` on any line and fell back to Townies.
    brandless,
    // Surfaced rather than swallowed: fetchAllOrders stops at 20 pages, and a
    // silently partial backfill would look identical to a complete one.
    truncated,
  });
}
