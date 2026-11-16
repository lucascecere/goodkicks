-- Public form spam quarantine (lib/form-guard.ts, lib/form-quarantine.ts).
-- Applied to blarfozjonigyqvlbejz on 2026-11-16.
create table if not exists public.form_spam (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  brand text,
  form text not null,
  name text,
  email text,
  reasons text[] not null default '{}',
  payload jsonb
);
create index if not exists form_spam_created_at_idx on public.form_spam (created_at desc);
alter table public.form_spam enable row level security;
