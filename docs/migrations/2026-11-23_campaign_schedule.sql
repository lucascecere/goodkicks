-- NOT YET APPLIED. Apply to Supabase project blarfozjonigyqvlbejz BEFORE the
-- deploy that ships scheduled campaign sends (the admin list, editor and
-- /api/cron/scheduled-campaigns all read these columns).
--
-- Scheduled campaign sends.
--
--   scheduled_for   when /api/cron/scheduled-campaigns (every 15 min) should send
--                   this draft. NULL = not scheduled. Stored UTC; the editor
--                   takes and shows America/New_York.
--   schedule_error  why the last scheduled attempt sent nothing (no matching
--                   contacts, Shopify buyer check down, every Resend batch
--                   failed). NULL when fine. Cleared on a new schedule.
--
-- status gains a transient 'sending' value: a send claims the row with
-- `update ... set status = 'sending' where id = $1 and status = 'draft'` before
-- any mail goes out, so the cron and the Send button can never both send it.
-- There is no check constraint on status, so nothing to change for that.
--
-- No migrations runner in this repo; this file is the record. Re-runnable.

alter table public.campaigns
  add column if not exists scheduled_for  timestamptz,
  add column if not exists schedule_error text;

-- The cron's only query: drafts that are due.
create index if not exists campaigns_scheduled_due_idx
  on public.campaigns (scheduled_for)
  where status = 'draft' and scheduled_for is not null;

select id, name, status, scheduled_for from public.campaigns order by updated_at desc limit 5;
