-- 2026-10-30: one-click unsubscribe for campaign mail (app/api/unsubscribe).
alter table public.contacts add column if not exists unsubscribed_at timestamptz;
