-- Spam is refused, never stored (Lucas 2026-11-16). Replaces form_spam: only an
-- aggregate count per Eastern day, site (brand) and reason. No PII.
-- reason 'all' = submissions refused; other reasons can overlap.
-- Applied to blarfozjonigyqvlbejz on 2026-11-16. The 14 form_spam rows (all
-- 11-16 probes) were counted in, then deleted.
create table if not exists public.spam_counts (
  day date not null,
  site text not null,
  reason text not null,
  count integer not null default 0,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  primary key (day, site, reason)
);
alter table public.spam_counts enable row level security;
revoke all on public.spam_counts from anon, authenticated;
create index if not exists spam_counts_reason_last_idx on public.spam_counts (reason, last_at desc);

create or replace function public.bump_spam_counts(p_site text, p_reasons text[])
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.spam_counts as s (day, site, reason, count, first_at, last_at)
  select (now() at time zone 'America/New_York')::date, coalesce(nullif(btrim(p_site), ''), 'townies'), r, 1, now(), now()
  from (
    select 'all'::text as r
    union
    select distinct left(btrim(x), 80) from unnest(coalesce(p_reasons, '{}'::text[])) as x
    where btrim(x) <> '' and btrim(x) <> 'all'
  ) reasons
  on conflict (day, site, reason)
  do update set count = s.count + 1, last_at = now();
$$;
revoke all on function public.bump_spam_counts(text, text[]) from public, anon, authenticated;
grant execute on function public.bump_spam_counts(text, text[]) to service_role;

-- form_spam is retired (no code reads or writes it after this commit):
-- drop table if exists public.form_spam;
