-- Town hat giveaway entries (website form at /giveaway). Service role only.
create table if not exists public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  campaign text not null default 'town-hats-2026-12',
  town text not null,           -- town slug, or 'other'
  other_town text,              -- typed town when town = 'other'
  name text not null,
  email text not null,
  ig_handle text,
  utm_source text,
  unique (campaign, email, town)
);
alter table public.giveaway_entries enable row level security;
create index if not exists giveaway_entries_campaign_town on public.giveaway_entries (campaign, town);
