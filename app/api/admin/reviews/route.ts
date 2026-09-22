// Approve / reject / delete a submitted review.
//
// Approving is the ONLY thing that puts a review on the site, and it is a human
// decision every time. There is deliberately no bulk "approve all": the point
// of the queue is that somebody read the words before a shopper does.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST { id, action: 'approve' | 'reject' | 'delete', name?, town?, quote? }
//
// The optional fields allow light editing on approval — trimming a surname to
// an initial, fixing a typo, cutting a rambling third paragraph. Changing what
// somebody MEANT is not what this is for.
export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    action?: string;
    name?: string;
    town?: string;
    quote?: string;
  } | null;

  const id = body?.id;
  const action = body?.action;
  if (!id || !action) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const db = createSupabaseServiceClient();

  if (action === 'delete') {
    const { error } = await db.from('reviews').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    approved_at: action === 'approve' ? new Date().toISOString() : null,
  };
  if (typeof body?.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body?.town === 'string') patch.town = body.town.trim() || null;
  if (typeof body?.quote === 'string' && body.quote.trim()) patch.quote = body.quote.trim();

  const { error } = await db.from('reviews').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
