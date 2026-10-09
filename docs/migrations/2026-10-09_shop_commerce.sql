-- Townies' own commerce engine (Stripe + Shippo), first used by the local
-- market. Every product belongs to a SELLER: Townies itself is the 'house'
-- seller, each local business is a 'local' seller. Prefixed shop_ because a
-- legacy, empty `orders` table already exists in this database.
--
-- Service-role only: RLS on, no policies. The app reads and writes through
-- createSupabaseServiceClient().

create table if not exists shop_sellers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null default 'local' check (kind in ('house', 'local')),
  town text,
  logo_url text,
  cover_url text,
  blurb text,
  status text not null default 'approved'
    check (status in ('applied', 'approved', 'live', 'paused', 'rejected')),
  source_type text not null default 'hat_client'
    check (source_type in ('house', 'hat_client', 'cold_applicant')),
  is_royalbacks_sourced boolean not null default false,
  stripe_account_id text,
  payouts_enabled boolean not null default false,
  pickup_enabled boolean not null default false,
  pickup_address text,
  pickup_notes text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  instagram text,
  invite_token text unique,
  invited_at timestamptz,
  joined_at timestamptz,
  application jsonb,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists shop_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references shop_sellers(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  image_url text,
  -- What we keep per hat: everyday $22, lifestyle $24. Copied onto each order
  -- line at purchase so a later change never rewrites past orders.
  wholesale_type text not null default 'everyday' check (wholesale_type in ('everyday', 'lifestyle')),
  wholesale_cents int not null default 2200 check (wholesale_cents >= 0),
  -- Set by the business. null until they pick one on their join link.
  price_cents int check (price_cents is null or price_cents > 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  on_hand int not null default 0,
  stock_buffer int not null default 5 check (stock_buffer >= 0),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, slug)
);
create index if not exists shop_products_seller_idx on shop_products (seller_id);

create sequence if not exists shop_order_number_seq start 1001;

create table if not exists shop_orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('shop_order_number_seq'),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'canceled', 'refunded', 'partially_refunded', 'disputed')),
  fulfillment text not null default 'unfulfilled'
    check (fulfillment in ('unfulfilled', 'needs_production', 'ready_for_pickup', 'picked_up', 'shipped', 'delivered', 'canceled')),
  delivery text not null check (delivery in ('ship', 'pickup')),
  pickup_seller_id uuid references shop_sellers(id),
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  shipping_address jsonb,
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  carrier text,
  tracking_number text,
  tracking_url text,
  label_url text,
  label_cost_cents int,
  shippo_transaction_id text,
  notes text,
  paid_at timestamptz,
  handed_over_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shop_orders_status_idx on shop_orders (status, fulfillment);

create table if not exists shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references shop_orders(id) on delete cascade,
  product_id uuid references shop_products(id) on delete set null,
  seller_id uuid not null references shop_sellers(id),
  title text not null,
  image_url text,
  qty int not null check (qty > 0),
  unit_price_cents int not null,
  wholesale_cents int not null,
  -- Line totals (× qty), frozen at purchase.
  seller_payout_cents int not null,
  royalbacks_fee_cents int not null default 0,
  our_cut_cents int not null,
  created_at timestamptz not null default now()
);
create index if not exists shop_order_items_order_idx on shop_order_items (order_id);

create table if not exists shop_payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references shop_orders(id) on delete cascade,
  recipient text not null check (recipient in ('seller', 'royalbacks')),
  seller_id uuid references shop_sellers(id),
  amount_cents int not null check (amount_cents >= 0),
  status text not null default 'held'
    check (status in ('held', 'due', 'transferred', 'reversed', 'canceled')),
  release_at timestamptz,
  stripe_account_id text,
  stripe_transfer_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists shop_payouts_one_per_party
  on shop_payouts (order_id, recipient, coalesce(seller_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index if not exists shop_payouts_status_idx on shop_payouts (status, release_at);

create table if not exists shop_reorders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references shop_products(id) on delete cascade,
  qty int not null check (qty > 0),
  status text not null default 'requested' check (status in ('requested', 'received', 'canceled')),
  note text,
  requested_at timestamptz not null default now(),
  received_at timestamptz
);

-- Stock moves in one statement so two orders can't read the same count.
-- Returns the new on-hand number (negative = made to order).
create or replace function shop_adjust_stock(p_product uuid, p_delta int)
returns int
language sql
security invoker
set search_path = public
as $$
  update shop_products
     set on_hand = on_hand + p_delta, updated_at = now()
   where id = p_product
  returning on_hand;
$$;

alter table shop_sellers enable row level security;
alter table shop_products enable row level security;
alter table shop_orders enable row level security;
alter table shop_order_items enable row level security;
alter table shop_payouts enable row level security;
alter table shop_reorders enable row level security;

revoke execute on function shop_adjust_stock(uuid, int) from public, anon, authenticated;

-- Townies is a seller too, so the town hats can move in later without a new model.
insert into shop_sellers (slug, name, kind, source_type, status, town, blurb)
values ('townies', 'Townies', 'house', 'house', 'live', 'Milton', 'Embroidered hats for Massachusetts towns.')
on conflict (slug) do nothing;

-- Logos and hat photos for the market.
insert into storage.buckets (id, name, public)
values ('shop', 'shop', true)
on conflict (id) do nothing;

-- Added 2026-10-09 (applied as migration `shop_settings`): small key/value
-- store for shop-wide settings, e.g. RoyalBacks' Stripe account id.
create table if not exists shop_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table shop_settings enable row level security;
