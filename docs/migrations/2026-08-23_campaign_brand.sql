-- Applied to Supabase project blarfozjonigyqvlbejz on 2026-08-23.
--
-- Campaigns become brand-scoped.
--
-- Before this, `campaigns` had no brand dimension at all: both send routes
-- hardcoded `from: 'Good Kicks <info@goodkicks.co>'` and Good Kicks email
-- chrome, so every campaign went out as Good Kicks to the entire contact list —
-- Townies hat buyers included. Segmentation was `sources` only.
--
-- TWO columns, deliberately:
--   brand           who the mail is FROM — sender address and email chrome.
--   audience_brands who it goes TO. Empty = no brand filter, which is exactly
--                   what every campaign did before this column existed, so the
--                   old behaviour survives untouched.
-- Kept separate because Good Kicks is a Townies product line now: a
-- Townies-branded email to the Good Kicks list is a normal thing to want to
-- send, and a single column could not express it.
--
-- There is no migrations runner in this repo (schema is managed in the Supabase
-- dashboard) — this file exists so the change is on the record and reproducible.
-- Every statement is re-runnable; a second run is a no-op.

alter table public.campaigns
  add column if not exists brand           text   not null default 'townies',
  add column if not exists audience_brands text[] not null default '{}';

alter table public.campaigns drop constraint if exists campaigns_brand_valid;
alter table public.campaigns
  add constraint campaigns_brand_valid check (brand in ('townies','goodkicks'));

alter table public.campaigns drop constraint if exists campaigns_audience_brands_valid;
alter table public.campaigns
  add constraint campaigns_audience_brands_valid
  check (audience_brands <@ array['townies','goodkicks']::text[]);

create index if not exists campaigns_brand_idx on public.campaigns (brand);

select brand, audience_brands, count(*) from public.campaigns group by 1, 2;
