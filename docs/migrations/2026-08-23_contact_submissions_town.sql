-- Applied to Supabase project blarfozjonigyqvlbejz on 2026-08-23.
--
-- contact_submissions has been silently discarding `brand` since the column was
-- added, and this is what fixes it.
--
-- app/api/contact/route.ts:141 inserts a `town` field on every submission. The
-- column never existed, so PostgREST rejected EVERY insert; insertSubmission's
-- retry (route.ts:81) matches /brand|town|column/i and strips `brand` ALONGSIDE
-- `town` before re-inserting, so the row lands on the column default. That is
-- why all 16 rows read 'goodkicks' — including four town_request rows, a form
-- that only exists on the Townies site.
--
-- Adding the column is what makes the brand fix in route.ts actually stick.
-- Without it, the retry keeps firing and keeps throwing brand away.
--
-- There is no migrations runner in this repo (schema is managed in the Supabase
-- dashboard) — this file exists so the change is on the record and reproducible.
-- Every statement is re-runnable; a second run is a no-op.

------------------------------------------------------------------------------
-- 1. The missing column.
------------------------------------------------------------------------------
alter table public.contact_submissions add column if not exists town text;

------------------------------------------------------------------------------
-- 2. Townies is the store now, so it is the default brand. Good Kicks becomes
--    the deliberate exception rather than the silent fallback.
------------------------------------------------------------------------------
alter table public.contact_submissions alter column brand set default 'townies';

alter table public.contact_submissions
  drop constraint if exists contact_submissions_brand_valid;
alter table public.contact_submissions
  add constraint contact_submissions_brand_valid
  check (brand is null or brand in ('townies','goodkicks'));

------------------------------------------------------------------------------
-- 3. Repair what the retry mislabelled. A town request or a bulk order is
--    Townies by definition — there is no Good Kicks page that submits either.
--    Everything else stays as-is: a 'general' submission genuinely could have
--    come from either brand and we have no evidence to re-attribute it.
------------------------------------------------------------------------------
update public.contact_submissions
   set brand = 'townies'
 where type in ('town_request','wholesale')
   and brand is distinct from 'townies';

------------------------------------------------------------------------------
-- 4. Lift the town back out of the message body, where route.ts:131 put it as
--    a fallback for the column that did not exist. The route still writes that
--    prefix (it is genuinely useful in the notification email), so this only
--    backfills the structured column for existing rows.
------------------------------------------------------------------------------
update public.contact_submissions
   set town = btrim(substring(message from 'Town: ([^\n]+)'))
 where type = 'town_request'
   and town is null
   and message ~ 'Town: ';

------------------------------------------------------------------------------
-- 5. Same direction for the rep table's default — Townies unless told otherwise.
------------------------------------------------------------------------------
alter table public.ambassador_applications alter column brand set default 'townies';

------------------------------------------------------------------------------
-- 6. Proof.
------------------------------------------------------------------------------
select type, brand, count(*), count(town) as with_town
  from public.contact_submissions
 group by 1, 2
 order by 3 desc;
