-- 2026-10-07: Mass trivia pop-up prizes include fixed-dollar codes ($5/$7/$10 off).
-- Applied to the GoodKicks Website project (blarfozjonigyqvlbejz) via MCP.
alter table public.spin_claims add column if not exists amount_off numeric(8,2);
alter table public.spin_claims drop constraint if exists spin_claims_kind_valid;
alter table public.spin_claims add constraint spin_claims_kind_valid check (discount_kind in ('percentage', 'free_shipping', 'fixed_amount'));
alter table public.spin_claims add constraint spin_claims_amount_range check (amount_off is null or (amount_off > 0 and amount_off <= 100));
