import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';


type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const supabase = createSupabaseServiceClient();
  const { data: sends, error } = await supabase
    .from('campaign_sends')
    .select('id, email, contact_name, resend_id, status, sent_at, delivered_at, opened_at, bounced_at, complained_at')
    .eq('campaign_id', id)
    .order('sent_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const summary = (sends ?? []).reduce(
    (acc, s) => {
      acc.total++;
      if (s.status === 'delivered') acc.delivered++;
      else if (s.status === 'opened') acc.opened++;
      else if (s.status === 'bounced') acc.bounced++;
      else if (s.status === 'complained') acc.complained++;
      return acc;
    },
    { total: 0, delivered: 0, opened: 0, bounced: 0, complained: 0 }
  );

  return Response.json({ sends: sends ?? [], summary });
}
