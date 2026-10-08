import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { shopifyAdminGraphQL } from '@/lib/shopify/admin-graphql';
import { newToken } from '@/lib/reviews/server';

/**
 * Queue review requests from DELIVERY dates, read straight from Shopify
 * (2026-10-07). Replaces relying on the fulfilment webhook alone: that
 * subscription never took, so the queue sat at zero for two weeks. Shopify
 * records `deliveredAt` from the carrier on every tracked fulfilment, so the
 * daily cron now asks Shopify directly. Nothing to subscribe, nothing to drop.
 *
 * Rules (Lucas, 10-07):
 * - ask 7 days after the parcel was DELIVERED;
 * - nothing delivered before REVIEW_FLOOR (Sept 1, 2026) is ever asked;
 * - one ask per order (unique index on shopify_order_id).
 * A fulfilment with no delivery scan (no tracking, local hand-off) is asked
 * NO_SCAN_DAYS after it shipped instead, so it isn't skipped forever.
 *
 * Queuing is not sending: the cron only sends when REVIEW_REQUESTS_ENABLED=1.
 */
export const REVIEW_FLOOR = new Date('2026-09-01T00:00:00Z');
const AFTER_DELIVERY_DAYS = 7;
const NO_SCAN_DAYS = 14;
const TOWNIES_LAUNCH = Date.parse('2026-07-04T00:00:00Z');

type OrderNode = {
  id: string;
  name: string;
  createdAt: string;
  email: string | null;
  customer: { firstName: string | null; lastName: string | null } | null;
  shippingAddress: { firstName: string | null; lastName: string | null } | null;
  lineItems: {
    nodes: Array<{
      title: string;
      product: { handle: string } | null;
      customAttributes: Array<{ key: string; value: string | null }>;
    }>;
  };
  fulfillments: Array<{ createdAt: string; deliveredAt: string | null; displayStatus: string | null }>;
};

const QUERY = `
  query Delivered($q: String!, $after: String) {
    orders(first: 50, after: $after, query: $q, sortKey: UPDATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id name createdAt email
        customer { firstName lastName }
        shippingAddress { firstName lastName }
        lineItems(first: 10) { nodes { title product { handle } customAttributes { key value } } }
        fulfillments(first: 5) { createdAt deliveredAt displayStatus }
      }
    }
  }
`;

export type PlannedRequest = {
  shopify_order_id: string;
  order_number: string;
  email: string;
  name: string | null;
  brand: 'townies' | 'goodkicks';
  product_title: string | null;
  product_handle: string | null;
  fulfilled_at: string;
  send_after: string;
  basis: 'delivered' | 'no-scan';
};

function brandOf(order: OrderNode): 'townies' | 'goodkicks' {
  const tags = order.lineItems.nodes.flatMap((l) => l.customAttributes.filter((a) => a.key === '_brand').map((a) => a.value));
  if (tags.includes('townies')) return 'townies';
  if (tags.includes('goodkicks')) return 'goodkicks';
  return Date.parse(order.createdAt) >= TOWNIES_LAUNCH ? 'townies' : 'goodkicks';
}

/** What should be queued, without writing anything. */
export async function planDeliveredRequests(now = new Date()): Promise<PlannedRequest[]> {
  const since = REVIEW_FLOOR.toISOString().slice(0, 10);
  const q = `fulfillment_status:shipped updated_at:>=${since}`;
  const out: PlannedRequest[] = [];
  let after: string | null = null;

  for (let page = 0; page < 10; page++) {
    const data: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: OrderNode[] } } =
      await shopifyAdminGraphQL(QUERY, { q, after });
    for (const o of data.orders.nodes) {
      if (!o.email) continue;
      const shipped = o.fulfillments.map((f) => Date.parse(f.createdAt)).filter(Number.isFinite);
      const delivered = o.fulfillments.map((f) => (f.deliveredAt ? Date.parse(f.deliveredAt) : NaN)).filter(Number.isFinite);
      let at: number;
      let basis: PlannedRequest['basis'];
      if (delivered.length) {
        at = Math.max(...delivered) + AFTER_DELIVERY_DAYS * 864e5;
        basis = 'delivered';
        if (Math.max(...delivered) < REVIEW_FLOOR.getTime()) continue;
      } else if (shipped.length) {
        // Still in transit (or never scanned): wait. Only fall back once it has
        // clearly had time to arrive.
        const ship = Math.max(...shipped);
        if (ship < REVIEW_FLOOR.getTime()) continue;
        if (now.getTime() - ship < NO_SCAN_DAYS * 864e5) continue;
        if (o.fulfillments.some((f) => f.displayStatus && /IN_TRANSIT|OUT_FOR_DELIVERY|LABEL_PRINTED|CONFIRMED/.test(f.displayStatus))) {
          // Has tracking but no delivery scan yet: keep waiting for the scan
          // unless it's been a long time.
          if (now.getTime() - ship < 2 * NO_SCAN_DAYS * 864e5) continue;
        }
        at = ship + NO_SCAN_DAYS * 864e5;
        basis = 'no-scan';
      } else continue;

      const first = o.lineItems.nodes.find((l) => l.product?.handle) ?? o.lineItems.nodes[0];
      const name =
        [o.shippingAddress?.firstName, o.shippingAddress?.lastName].filter(Boolean).join(' ') ||
        [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') ||
        null;
      out.push({
        shopify_order_id: o.id.split('/').pop()!,
        order_number: o.name.replace('#', ''),
        email: o.email,
        name,
        brand: brandOf(o),
        product_title: first?.title ?? null,
        product_handle: first?.product?.handle ?? null,
        fulfilled_at: new Date(shipped.length ? Math.max(...shipped) : Date.parse(o.createdAt)).toISOString(),
        send_after: new Date(at).toISOString(),
        basis,
      });
    }
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
  }
  return out;
}

/** Queue every planned request not already queued. Returns how many were new. */
export async function syncDeliveredRequests(): Promise<{ planned: number; queued: number }> {
  const plan = await planDeliveredRequests();
  if (!plan.length) return { planned: 0, queued: 0 };
  const rows = plan.map(({ basis: _basis, ...r }) => ({ ...r, token: newToken() }));
  const { data, error } = await createSupabaseServiceClient()
    .from('review_requests')
    .upsert(rows, { onConflict: 'shopify_order_id', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(`review queue upsert failed: ${error.message}`);
  return { planned: plan.length, queued: data?.length ?? 0 };
}
