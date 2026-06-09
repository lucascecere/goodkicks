import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// PATCH body: { applicationId, discount_code?, tier_pct?, status?, approved? }
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { applicationId, ...fields } = await req.json();
  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }

  const allowed = ['discount_code', 'tier_pct', 'status', 'approved', 'notes', 'email', 'name', 'instagram', 'school', 'account_type', 'followers', 'colorway_preference', 'shipping_address', 'age'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('ambassador_applications')
    .update(update)
    .eq('id', applicationId);

  if (error) {
    console.error('[update-ambassador]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
