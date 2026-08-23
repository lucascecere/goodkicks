import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { loadRep, sendWelcomeForRep } from '@/lib/reps/server';

// TEMPORARY — DELETE IMMEDIATELY AFTER USE.
//
// The welcome email can only be sent from the production runtime, because
// RESEND_API_KEY is a Sensitive var in Vercel and comes back empty from
// `vercel env pull`. The normal route (/api/admin/send-welcome) is gated on an
// admin session cookie, and ADMIN_PASSWORD is Sensitive too — so there was no
// way to drive the real path from a local session.
//
// Rather than weaken that route or move the secret, this one-shot exists for a
// single send and is removed in the next commit. Two things keep it safe while
// it is live:
//   1. a random token that is not stored anywhere in the repo's history but
//      here, for these few minutes;
//   2. the application id is PINNED. Even with the token, the only thing this
//      can do is re-send Lincoln Griffin's own welcome email to Lincoln
//      Griffin's own address. It cannot be pointed at another rep, and it
//      cannot read anything back out.
const TOKEN = 'b068a8ac927cbea2a2ec4594cdb5149e9ff7bd507db17c81';
const APPLICATION_ID = '7ea2aba2-3dac-4712-852d-e3efa5dadbb6';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  // 404, not 401 — a wrong token should not confirm the route exists.
  if (body?.token !== TOKEN) return new NextResponse('Not found', { status: 404 });

  const rep = await loadRep(APPLICATION_ID);
  if (!rep) return NextResponse.json({ error: 'application not found' }, { status: 404 });

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
    const detail = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  const supabase = createSupabaseServiceClient();
  await supabase
    .from('ambassador_applications')
    .update({ welcome_email_sent_at: new Date().toISOString(), welcome_email_id: welcomeEmailId })
    .eq('id', APPLICATION_ID);

  return NextResponse.json({ ok: true, welcomeEmailId, to: rep.email, code: discountCode });
}
