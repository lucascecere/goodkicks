import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

function isAuthed(req: NextRequest) {
  return req.cookies.get('gk_admin')?.value === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { applicationId } = await req.json();
  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('ambassador_applications')
    .update({ status: 'rejected', approved: false })
    .eq('id', applicationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
