import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-password') !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: 'DB error' }, { status: 500 });
  return Response.json({ orders: data });
}
