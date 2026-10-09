import 'server-only';
import type { AdminBrand } from './brand';
import { listOrderItemsFor, listOrders, listSellers, getOrder, getOrderItems } from '@/lib/shop/db';
import { FULFILLMENT_LABEL, type Order as ShopOrder, type OrderItem as ShopOrderItem, type Seller } from '@/lib/shop/types';
import {
  fetchAllOrders,
  lineBrand,
  type ShopifyOrder,
} from '@/lib/shopify/orders-source';

// One order shape for the admin, whatever sold it.
//
// Today every order comes from Shopify. The marketplace (and, later, the town
// hats) sell through our own Stripe checkout; those orders map into this same
// shape so the Orders page is one list, not one per system.

export type OrderSource = 'shopify' | 'market';

export type PaymentState = 'paid' | 'pending' | 'refunded' | 'partially_refunded' | 'voided' | 'disputed' | 'other';
export type ShipState = 'unfulfilled' | 'partial' | 'fulfilled' | 'cancelled' | 'archived';

export type AdminOrderLine = {
  title: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
};

export type AdminOrderRow = {
  /** Route id: `s-<shopify id>` or `m-<uuid>`. */
  key: string;
  source: OrderSource;
  number: string;
  createdAt: string;
  customer: string;
  email: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  payment: PaymentState;
  ship: ShipState;
  brand: 'townies' | 'goodkicks' | 'mixed';
  discountCode: string | null;
  lines: AdminOrderLine[];
  address: {
    name: string | null;
    lines: string[];
    phone: string | null;
  } | null;
  tracking: { company: string | null; number: string | null; url: string | null; status: string | null }[];
  note: string | null;
  /** Where the order is managed until it moves into our own system. */
  externalUrl: string | null;
  /** More precise status text than `ship` (market orders: "Ready for pickup"…). */
  shipLabel?: string;
  /** Our own orders carry the raw rows so the detail page can act on them. */
  market?: { order: ShopOrder; items: ShopOrderItem[]; sellers: Record<string, Pick<Seller, 'id' | 'name' | 'pickup_address'>> };
};

const SHOPIFY_ADMIN_ORDERS = 'https://admin.shopify.com/store/good-kicks-foot-bags-2/orders';

function payment(o: ShopifyOrder): PaymentState {
  switch (o.financial_status) {
    case 'paid':
      return 'paid';
    case 'pending':
    case 'authorized':
      return 'pending';
    case 'refunded':
      return 'refunded';
    case 'partially_refunded':
      return 'partially_refunded';
    case 'voided':
      return 'voided';
    default:
      return 'other';
  }
}

function ship(o: ShopifyOrder): ShipState {
  if (o.cancelled_at) return 'cancelled';
  // Archived in Shopify without being shipped (old Good Kicks orders, free
  // ambassador packages): done as far as the To ship pile is concerned.
  if (o.closed_at && o.fulfillment_status !== 'fulfilled') return 'archived';
  if (o.fulfillment_status === 'fulfilled') return 'fulfilled';
  if (o.fulfillment_status === 'partial') return 'partial';
  return 'unfulfilled';
}

function fromShopify(o: ShopifyOrder): AdminOrderRow {
  const brands = new Set(o.line_items.map((li) => lineBrand(li, o.created_at)));
  const name =
    [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(' ') ||
    o.shipping_address?.name ||
    o.email ||
    'Guest';
  const a = o.shipping_address;
  return {
    key: `s-${o.id}`,
    source: 'shopify',
    number: o.name,
    createdAt: o.created_at,
    customer: name,
    email: o.email ?? null,
    total: parseFloat(o.total_price),
    subtotal: parseFloat(o.subtotal_price ?? o.total_price),
    shipping: parseFloat(o.total_shipping_price_set?.shop_money?.amount ?? '0'),
    tax: parseFloat(o.total_tax ?? '0'),
    payment: payment(o),
    ship: ship(o),
    brand: brands.size > 1 ? 'mixed' : ((brands.values().next().value as 'townies' | 'goodkicks') ?? 'townies'),
    discountCode: o.discount_codes[0]?.code ?? null,
    lines: o.line_items.map((li) => ({
      title: li.title,
      variant: li.variant_title ?? null,
      quantity: li.quantity,
      unitPrice: parseFloat(li.price),
    })),
    address: a
      ? {
          name: a.name ?? null,
          lines: [
            a.address1,
            a.address2,
            [a.city, a.province_code].filter(Boolean).join(', ') + (a.zip ? ` ${a.zip}` : ''),
          ].filter((l): l is string => Boolean(l && l.trim())),
          phone: a.phone ?? null,
        }
      : null,
    tracking: (o.fulfillments ?? []).map((f) => ({
      company: f.tracking_company ?? null,
      number: f.tracking_number ?? null,
      url: f.tracking_url ?? null,
      status: f.shipment_status ?? null,
    })),
    note: o.note ?? null,
    externalUrl: `${SHOPIFY_ADMIN_ORDERS}/${o.id}`,
  };
}

function marketPayment(o: ShopOrder): PaymentState {
  if (o.status === 'paid') return 'paid';
  if (o.status === 'refunded') return 'refunded';
  if (o.status === 'partially_refunded') return 'partially_refunded';
  if (o.status === 'disputed') return 'disputed';
  return 'pending';
}

function marketShip(o: ShopOrder): ShipState {
  if (o.fulfillment === 'canceled') return 'cancelled';
  if (o.fulfillment === 'shipped' || o.fulfillment === 'delivered' || o.fulfillment === 'picked_up') return 'fulfilled';
  return 'unfulfilled';
}

function fromMarket(o: ShopOrder, items: ShopOrderItem[], sellers: Map<string, Seller>): AdminOrderRow {
  const a = o.shipping_address;
  const pickup = o.pickup_seller_id ? sellers.get(o.pickup_seller_id) : undefined;
  const sellerIds = [...new Set(items.map((i) => i.seller_id))];
  return {
    key: `m-${o.id}`,
    source: 'market',
    number: `L${o.number}`,
    createdAt: o.paid_at ?? o.created_at,
    customer: o.buyer_name || o.buyer_email || 'Buyer',
    email: o.buyer_email,
    total: o.total_cents / 100,
    subtotal: o.subtotal_cents / 100,
    shipping: o.shipping_cents / 100,
    tax: o.tax_cents / 100,
    payment: marketPayment(o),
    ship: marketShip(o),
    shipLabel: FULFILLMENT_LABEL[o.fulfillment],
    brand: 'townies',
    discountCode: null,
    lines: items.map((i) => ({ title: i.title, variant: null, quantity: i.qty, unitPrice: i.unit_price_cents / 100 })),
    address: a
      ? {
          name: a.name ?? null,
          lines: [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', ') + (a.postal_code ? ` ${a.postal_code}` : '')].filter(
            (l): l is string => Boolean(l && l.trim()),
          ),
          phone: o.buyer_phone,
        }
      : pickup
        ? { name: `Pickup at ${pickup.name}`, lines: pickup.pickup_address ? [pickup.pickup_address] : [], phone: o.buyer_phone }
        : null,
    tracking: o.tracking_number ? [{ company: o.carrier, number: o.tracking_number, url: o.tracking_url, status: null }] : [],
    note: o.notes,
    externalUrl: null,
    market: {
      order: o,
      items,
      sellers: Object.fromEntries(
        sellerIds.concat(o.pickup_seller_id ? [o.pickup_seller_id] : []).map((id) => {
          const s = sellers.get(id);
          return [id, { id, name: s?.name ?? 'Business', pickup_address: s?.pickup_address ?? null }];
        }),
      ),
    },
  };
}

async function marketRows(): Promise<AdminOrderRow[]> {
  try {
    const orders = await listOrders({ paidOnly: true });
    if (!orders.length) return [];
    const [items, sellers] = await Promise.all([listOrderItemsFor(orders.map((o) => o.id)), listSellers({ includeHouse: true })]);
    const byOrder = new Map<string, ShopOrderItem[]>();
    for (const i of items) byOrder.set(i.order_id, [...(byOrder.get(i.order_id) ?? []), i]);
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));
    return orders.map((o) => fromMarket(o, byOrder.get(o.id) ?? [], sellerMap));
  } catch (err) {
    console.error('[admin] market orders read failed', err);
    return [];
  }
}

export type OrdersResult = { orders: AdminOrderRow[]; truncated: boolean; configured: boolean };

/** Every order, newest first, scoped to the admin brand filter. */
export async function listAdminOrders(brand: AdminBrand = 'all'): Promise<OrdersResult> {
  const configured = Boolean(process.env.SHOPIFY_ADMIN_API_TOKEN && process.env.SHOPIFY_STORE_DOMAIN);
  const [{ orders, truncated }, market] = await Promise.all([
    configured ? fetchAllOrders() : Promise.resolve({ orders: [] as ShopifyOrder[], truncated: false }),
    marketRows(),
  ]);
  const rows = [...orders.map(fromShopify), ...market]
    .filter((r) => brand === 'all' || r.brand === brand || r.brand === 'mixed')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { orders: rows, truncated, configured: configured || market.length > 0 };
}

export async function getAdminOrder(key: string): Promise<AdminOrderRow | null> {
  if (key.startsWith('s-')) {
    const { orders } = await fetchAllOrders();
    const hit = orders.find((o) => `s-${o.id}` === key);
    return hit ? fromShopify(hit) : null;
  }
  if (key.startsWith('m-')) {
    const id = key.slice(2);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const o = await getOrder(id);
    if (!o) return null;
    const [items, sellers] = await Promise.all([getOrderItems(o.id), listSellers({ includeHouse: true })]);
    return fromMarket(o, items, new Map(sellers.map((s) => [s.id, s])));
  }
  return null;
}

/** Paid, not cancelled, not yet shipped: the "to ship" pile. */
export function needsShipping(o: AdminOrderRow): boolean {
  return (o.payment === 'paid' || o.payment === 'partially_refunded') && (o.ship === 'unfulfilled' || o.ship === 'partial');
}

export const PAYMENT_LABEL: Record<PaymentState, string> = {
  paid: 'Paid',
  pending: 'Pending',
  refunded: 'Refunded',
  partially_refunded: 'Part refunded',
  voided: 'Voided',
  disputed: 'Disputed',
  other: 'Other',
};

export const SHIP_LABEL: Record<ShipState, string> = {
  unfulfilled: 'To ship',
  partial: 'Part shipped',
  fulfilled: 'Shipped',
  cancelled: 'Cancelled',
  archived: 'Archived',
};
