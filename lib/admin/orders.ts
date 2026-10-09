import 'server-only';
import type { AdminBrand } from './brand';
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

export type PaymentState = 'paid' | 'pending' | 'refunded' | 'partially_refunded' | 'voided' | 'other';
export type ShipState = 'unfulfilled' | 'partial' | 'fulfilled' | 'cancelled';

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

export type OrdersResult = { orders: AdminOrderRow[]; truncated: boolean; configured: boolean };

/** Every order, newest first, scoped to the admin brand filter. */
export async function listAdminOrders(brand: AdminBrand = 'all'): Promise<OrdersResult> {
  const configured = Boolean(process.env.SHOPIFY_ADMIN_API_TOKEN && process.env.SHOPIFY_STORE_DOMAIN);
  if (!configured) return { orders: [], truncated: false, configured };

  const { orders, truncated } = await fetchAllOrders();
  const rows = orders
    .map(fromShopify)
    .filter((r) => brand === 'all' || r.brand === brand || r.brand === 'mixed')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return { orders: rows, truncated, configured };
}

export async function getAdminOrder(key: string): Promise<AdminOrderRow | null> {
  if (key.startsWith('s-')) {
    const { orders } = await fetchAllOrders();
    const hit = orders.find((o) => `s-${o.id}` === key);
    return hit ? fromShopify(hit) : null;
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
  other: 'Other',
};

export const SHIP_LABEL: Record<ShipState, string> = {
  unfulfilled: 'To ship',
  partial: 'Part shipped',
  fulfilled: 'Shipped',
  cancelled: 'Cancelled',
};
