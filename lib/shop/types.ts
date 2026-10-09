// Row shapes for the shop_* tables (docs/migrations/2026-10-09_shop_commerce.sql).

import type { WholesaleType } from './money';

export type SellerStatus = 'applied' | 'approved' | 'live' | 'paused' | 'rejected';
export type SellerSource = 'house' | 'hat_client' | 'cold_applicant';

export type Seller = {
  id: string;
  slug: string;
  name: string;
  kind: 'house' | 'local';
  town: string | null;
  logo_url: string | null;
  cover_url: string | null;
  blurb: string | null;
  status: SellerStatus;
  source_type: SellerSource;
  is_royalbacks_sourced: boolean;
  stripe_account_id: string | null;
  payouts_enabled: boolean;
  pickup_enabled: boolean;
  pickup_address: string | null;
  pickup_notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  instagram: string | null;
  invite_token: string | null;
  invited_at: string | null;
  joined_at: string | null;
  application: Record<string, unknown> | null;
  sort: number;
  created_at: string;
  updated_at: string;
};

export type ProductStatus = 'draft' | 'active' | 'archived';

export type Product = {
  id: string;
  seller_id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  wholesale_type: WholesaleType;
  wholesale_cents: number;
  price_cents: number | null;
  status: ProductStatus;
  on_hand: number;
  stock_buffer: number;
  sort: number;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = 'pending' | 'paid' | 'canceled' | 'refunded' | 'partially_refunded' | 'disputed';
export type Fulfillment =
  | 'unfulfilled'
  | 'needs_production'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'shipped'
  | 'delivered'
  | 'canceled';

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  delivery: 'ship' | 'pickup';
  pickup_seller_id: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  shipping_address: ShippingAddress | null;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  label_cost_cents: number | null;
  shippo_transaction_id: string | null;
  notes: string | null;
  paid_at: string | null;
  handed_over_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  seller_id: string;
  title: string;
  image_url: string | null;
  qty: number;
  unit_price_cents: number;
  wholesale_cents: number;
  seller_payout_cents: number;
  royalbacks_fee_cents: number;
  our_cut_cents: number;
};

export type PayoutStatus = 'held' | 'due' | 'transferred' | 'reversed' | 'canceled';

export type Payout = {
  id: string;
  order_id: string;
  recipient: 'seller' | 'royalbacks';
  seller_id: string | null;
  amount_cents: number;
  status: PayoutStatus;
  release_at: string | null;
  stripe_account_id: string | null;
  stripe_transfer_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type Reorder = {
  id: string;
  product_id: string;
  qty: number;
  status: 'requested' | 'received' | 'canceled';
  note: string | null;
  requested_at: string;
  received_at: string | null;
};

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  unfulfilled: 'To ship',
  needs_production: 'Order from RoyalBacks',
  ready_for_pickup: 'Ready for pickup',
  picked_up: 'Picked up',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

export const SELLER_STATUS_LABEL: Record<SellerStatus, string> = {
  applied: 'Applied',
  approved: 'Approved',
  live: 'Live',
  paused: 'Paused',
  rejected: 'Rejected',
};
