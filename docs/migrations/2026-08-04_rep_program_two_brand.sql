-- Applied to Supabase project blarfozjonigyqvlbejz on 2026-08-04.
--
-- Two-brand rep program: Townies "Town Reps" + Good Kicks ambassadors share
-- ambassador_applications. There is no migrations runner in this repo (schema is
-- managed in the Supabase dashboard) — this file exists so the change is on the
-- record and reproducible.
--
-- Context for the new columns:
--   brand                 previously implicit; all 27 pre-existing rows are Good Kicks
--   town / hat_preference Townies analogs of school / colorway_preference
--   commission_pct        what the rep earns (revenue-based)
--   discount_pct          what the customer saves — previously conflated with
--                         commission in the single `tier_pct` column, which is why
--                         an "8% commission" rep minted a code giving 8% off
--   notes                 the update-ambassador allowlist already accepted this
--                         field, but the column did not exist, so the write 500'd
--   shopify_discount_gid  lets the admin UPDATE a live Shopify code instead of
--                         letting the stored % drift from the real one

alter table ambassador_applications
  add column if not exists brand text not null default 'goodkicks',
  add column if not exists town text,
  add column if not exists hat_preference text,
  add column if not exists commission_pct integer,
  add column if not exists discount_pct integer,
  add column if not exists notes text,
  add column if not exists shopify_discount_gid text;

-- Townies reps give a town, not a school.
alter table ambassador_applications alter column school drop not null;

-- Split the legacy conflated tier_pct into its two real meanings.
update ambassador_applications
  set commission_pct = coalesce(tier_pct, 8),
      discount_pct = 15
  where commission_pct is null;

alter table ambassador_applications
  add constraint commission_pct_range check (commission_pct is null or commission_pct between 0 and 20),
  add constraint discount_pct_range   check (discount_pct   is null or discount_pct   between 0 and 20),
  add constraint brand_valid          check (brand in ('townies','goodkicks'));

create index if not exists ambassador_applications_discount_code_idx
  on ambassador_applications (upper(discount_code));
create index if not exists ambassador_applications_brand_idx
  on ambassador_applications (brand);

-- Note: `tier_pct` is intentionally left in place and untouched. Nothing writes
-- it any more, but dropping it would break nothing and gain nothing today.
