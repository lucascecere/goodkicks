import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';

// Schedule / unschedule a draft. Kept apart from the campaign PATCH on
// purpose: saving the draft never touches scheduled_for, so a save can't
// silently switch a schedule off (or on). /api/cron/scheduled-campaigns does
// the sending, every 15 minutes.

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const at = typeof body?.scheduledFor === 'string' ? new Date(body.scheduledFor) : null;
  if (!at || Number.isNaN(at.getTime())) {
    return Response.json({ error: 'Pick a date and time.' }, { status: 400 });
  }
  if (at.getTime() < Date.now() - 60_000) {
    return Response.json({ error: 'That time has already passed.' }, { status: 400 });
  }
  if (at.getTime() > Date.now() + 365 * 86_400_000) {
    return Response.json({ error: 'Pick a time within the next year.' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ scheduled_for: at.toISOString(), schedule_error: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id, scheduled_for');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data?.length) return Response.json({ error: 'Only a draft can be scheduled.' }, { status: 409 });
  return Response.json({ ok: true, scheduledFor: data[0].scheduled_for });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ scheduled_for: null, schedule_error: null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'draft')
    .select('id');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data?.length) return Response.json({ error: 'This campaign is already sending or sent.' }, { status: 409 });
  return Response.json({ ok: true });
}
