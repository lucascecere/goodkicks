-- Applied to Supabase project blarfozjonigyqvlbejz on 2026-08-22.
--
-- Townies rotary spin — one row per claimed spin.
--
-- Only CLAIMED spins land here. A spin that nobody put an email against is not
-- a lead, and recording it would make the conversion numbers meaningless.
--
-- The three unique indexes below are the real guarantees behind the feature —
-- the in-memory rate limiter in lib/townies/spin-ratelimit.ts is best-effort
-- only (it resets on every cold start):
--   email+brand  one code per person, ever
--   token_nonce  one claim per spin, so a captured token can't be replayed
--   code         belt and braces against a Shopify suffix collision
--
-- There is no migrations runner in this repo (schema is managed in the Supabase
-- dashboard) — this file exists so the change is on the record and reproducible.

create table if not exists public.spin_claims (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  email                text not null,
  brand                text not null default 'townies',
  prize_id             text not null,
  prize_label          text not null,
  discount_code        text not null,
  discount_kind        text not null,
  percent_off          integer,
  shopify_discount_gid text,
  expires_at           timestamptz,
  token_nonce          text not null,
  -- Salted SHA-256, truncated. Enough to spot one person farming codes across
  -- burner addresses; not enough to be a stored IP address.
  ip_hash              text,
  email_message_id     text,
  -- Filled by the Shopify order webhook when the code is actually used, which
  -- is what turns this from a signup list into an attribution table.
  redeemed_at          timestamptz,
  redeemed_order_id    text,
  constraint spin_claims_brand_valid check (brand in ('townies', 'goodkicks')),
  constraint spin_claims_kind_valid  check (discount_kind in ('percentage', 'free_shipping')),
  constraint spin_claims_pct_range   check (percent_off is null or percent_off between 1 and 100)
);

create unique index if not exists spin_claims_email_brand_key
  on public.spin_claims (lower(email), brand);
create unique index if not exists spin_claims_token_nonce_key
  on public.spin_claims (token_nonce);
create unique index if not exists spin_claims_code_key
  on public.spin_claims (upper(discount_code));
create index if not exists spin_claims_created_at_idx
  on public.spin_claims (created_at desc);

-- RLS on with no policies: service role only, matching every other table in
-- this project. The anon key must never be able to read a discount code.
alter table public.spin_claims enable row level security;
