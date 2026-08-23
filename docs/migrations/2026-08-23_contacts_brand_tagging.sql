-- Applied to Supabase project blarfozjonigyqvlbejz on 2026-08-23.
--
-- Milestone 1 — every contact carries a brand.
--
-- Before this ran: 180 contacts, 158 of them brands = '{}'. Brand was only ever
-- written by the two paths that happened to have one in hand (the Shopify order
-- webhook and the Townies rotary), so nine tenths of the list was unattributed
-- and neither brand could mail its own people. The other seven capture paths
-- were fixed in the same change set; this file deals with the existing rows.
--
-- RUN ORDER MATTERS. Press "sync shopify orders" in /admin/contacts BEFORE
-- section 3. That pass writes through upsert_contact, which unions brands in
-- from real order history — the strongest signal there is. Section 3 then only
-- touches what Shopify could not answer for.
--
-- NOTE on that sync: the Admin API returns only ~60 days of orders without the
-- read_all_orders scope, so it sees 19 of the store's orders and resolved
-- nothing new here — every contact it could reach was already tagged. The date
-- rule in section 3 is therefore doing the real work, which is fine: every
-- order older than the window predates Townies anyway.
--
-- There is no migrations runner in this repo (schema is managed in the Supabase
-- dashboard) — this file exists so the change is on the record and reproducible.
-- Every statement is re-runnable; a second run is a no-op.

------------------------------------------------------------------------------
-- 1. Guard rail. `brands` was free-form text[]. A typo'd 'townie' would index
--    in contacts_brands_idx, pass every filter, and quietly become a third
--    brand that one campaign segment can see and no other can.
------------------------------------------------------------------------------
alter table public.contacts drop constraint if exists contacts_brands_valid;
alter table public.contacts
  add constraint contacts_brands_valid
  check (brands <@ array['townies','goodkicks']::text[]);
-- '{}' is contained by anything, so existing untagged rows pass.

------------------------------------------------------------------------------
-- 2. upsert_contact keeps its union semantics and gains input validation.
--
--    The union is deliberate and stays: capture paths may only ever ADD a
--    brand. Somebody who buys a hat and then a foot bag is both, and an
--    unauthenticated form post must not be able to erase a tag. Correcting a
--    WRONG tag is a separate, authenticated path — the admin contacts PATCH
--    route — which is the thing that did not exist before this milestone.
------------------------------------------------------------------------------
create or replace function public.upsert_contact(
  p_email  text,
  p_name   text,
  p_source text,
  p_brand  text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  -- Anything that is not one of the two real brands is treated as "no brand"
  -- rather than written through.
  v_brand text := case when p_brand in ('townies','goodkicks') then p_brand end;
begin
  insert into contacts (email, name, sources, brands)
  values (
    lower(trim(p_email)),
    p_name,
    array[p_source],
    case when v_brand is null then '{}'::text[] else array[v_brand] end
  )
  on conflict (email) do update set
    name = coalesce(contacts.name, excluded.name),
    sources = case
      when p_source = any(contacts.sources) then contacts.sources
      else array_append(contacts.sources, p_source)
    end,
    brands = case
      when v_brand is null or v_brand = any(contacts.brands) then contacts.brands
      else array_append(contacts.brands, v_brand)
    end,
    updated_at = now();
end;
$function$;

------------------------------------------------------------------------------
-- 3. THE BACKFILL. Ordered by how much each signal actually knows.
--
--    (a) ambassador_applications.brand — the applicant picked it themselves.
--    (b) contact_submissions.type — a town request or a bulk/wholesale inquiry
--        can only have come from /request-a-town or /wholesale, which are
--        Townies-only pages. NOTE: contact_submissions.BRAND is deliberately
--        not consulted. Every row in that table read 'goodkicks' because the
--        missing `town` column sent every insert down the retry path that
--        stripped brand (see 2026-08-23_contact_submissions_town.sql). The type
--        column is the honest signal; the brand column was an artefact.
--    (c) created_at vs the Townies launch. The two-brand app shipped on
--        2026-07-04. Anything captured before it belongs to the only brand
--        that existed at the time.
--    (d) Townies, the default, for anything none of the above can reach.
--
--    Dry-run before applying: 150 -> goodkicks, 8 -> townies, 0 unresolved.
--
--    `where c.brands = '{}'` appears twice on purpose: it is what makes this
--    re-runnable and what stops it clobbering a tag Shopify already got right.
------------------------------------------------------------------------------
with inferred as (
  select
    c.id,
    coalesce(
      (select a.brand
         from public.ambassador_applications a
        where lower(a.email) = lower(c.email)
        order by (a.brand = 'townies') desc, a.created_at desc
        limit 1),
      (select 'townies'::text
         from public.contact_submissions s
        where lower(s.email) = lower(c.email)
          and s.type in ('town_request','wholesale')
        limit 1),
      case when c.created_at < timestamptz '2026-07-04 00:00:00+00'
           then 'goodkicks' else 'townies' end
    ) as brand
  from public.contacts c
  where c.brands = '{}'
)
update public.contacts c
   set brands = array[i.brand], updated_at = now()
  from inferred i
 where c.id = i.id
   and c.brands = '{}';

------------------------------------------------------------------------------
-- 4. Anybody who applied to BOTH rep programs gets both tags. Additive, so it
--    cannot undo section 3; the `not (… <@ …)` guard makes it a no-op on a
--    second run.
------------------------------------------------------------------------------
update public.contacts c
   set brands = (select array_agg(distinct b) from unnest(c.brands || a.brands) b),
       updated_at = now()
  from (select lower(email) as email, array_agg(distinct brand) as brands
          from public.ambassador_applications group by 1) a
 where lower(c.email) = a.email
   and not (a.brands <@ c.brands);

------------------------------------------------------------------------------
-- 5. Proof. Expect untagged = 0.
------------------------------------------------------------------------------
select count(*) filter (where brands = '{}')                as untagged,
       count(*) filter (where brands @> array['townies'])   as townies,
       count(*) filter (where brands @> array['goodkicks']) as goodkicks,
       count(*)                                             as total
  from public.contacts;

-- Rollback, if the split reads wrong:
--   update public.contacts c set brands = b.brands
--     from contacts_brands_backup_20260823 b where c.id = b.id;
