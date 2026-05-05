import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

// Manual trigger — use when you need to resend the welcome email for an approved ambassador.
// POST body: { firstName, email, discountCode, colorway, tierPct }
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { firstName, email, discountCode, colorway, tierPct = 15 } = body ?? {};

  if (!firstName || !email || !discountCode) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  try {
    await sendWelcomeEmail({ firstName, email, discountCode, colorway: colorway ?? 'your choice', tierPct });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-welcome] Error:', err);
    return NextResponse.json({ error: 'failed to send email' }, { status: 500 });
  }
}
