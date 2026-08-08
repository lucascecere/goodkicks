import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminAuthed, loadRep, sendWelcomeForRep } from '@/lib/reps/server';

// POST { applicationId } — re-sends the welcome email in the rep's brand voice.
// Everything is read fresh from the DB so a just-edited email/code is used, not
// a stale client-side copy.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }

  const rep = await loadRep(applicationId);
  if (!rep) {
    return NextResponse.json({ error: 'application not found' }, { status: 404 });
  }

  const discountCode = rep.discount_code;
  if (!discountCode || !rep.email) {
    return NextResponse.json({ error: 'rep needs an email and a discount code first' }, { status: 400 });
  }

  let welcomeEmailId: string;
  try {
    welcomeEmailId = await sendWelcomeForRep(rep, {
      discountCode,
      discountPct: rep.discount_pct ?? 15,
      commissionPct: rep.commission_pct ?? rep.tier_pct ?? 10,
    });
  } catch (err) {
    console.error('[send-welcome] Error:', err);
    const detail = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  const supabase = createSupabaseServiceClient();
  await supabase
    .from('ambassador_applications')
    .update({ welcome_email_sent_at: new Date().toISOString(), welcome_email_id: welcomeEmailId })
    .eq('id', applicationId);

  return NextResponse.json({ ok: true, welcomeEmailId });
}
