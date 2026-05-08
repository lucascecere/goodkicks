import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// POST body: { applicationId, firstName, email, discountCode, colorway, tierPct }
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { applicationId, firstName, email, discountCode, colorway, tierPct = 8 } = body ?? {};

  if (!firstName || !email || !discountCode) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  try {
    await sendWelcomeEmail({ firstName, email, discountCode, colorway: colorway ?? 'your choice', tierPct });
  } catch (err) {
    console.error('[send-welcome] Error:', err);
    return NextResponse.json({ error: 'failed to send email' }, { status: 500 });
  }

  if (applicationId) {
    const supabase = createSupabaseServiceClient();
    await supabase
      .from('ambassador_applications')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', applicationId);
  }

  return NextResponse.json({ ok: true });
}
