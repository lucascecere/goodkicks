import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { createAmbassadorDiscountCode } from '@/lib/shopify/create-discount-code';
import { sendWelcomeEmail } from '@/lib/email/send-welcome';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { applicationId, tierPct = 15 } = body ?? {};

  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  const { data: app, error } = await supabase
    .from('ambassador_applications')
    .select('name, email, instagram, colorway_preference')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: 'application not found' }, { status: 404 });
  }

  const firstName = (app.name as string).split(' ')[0];
  const instagram = app.instagram as string;
  const email = app.email as string;
  const colorway = (app.colorway_preference as string | null) ?? 'your choice';

  // Use provided code, or auto-create via Shopify Admin API if token is available
  let discountCode: string = body.discountCode ?? '';
  if (!discountCode) {
    if (!process.env.SHOPIFY_ADMIN_API_TOKEN) {
      return NextResponse.json({ error: 'discountCode is required (no SHOPIFY_ADMIN_API_TOKEN set)' }, { status: 400 });
    }
    try {
      discountCode = await createAmbassadorDiscountCode({ instagramHandle: instagram, tierPct });
    } catch (err) {
      console.error('[approve-ambassador] Discount code error:', err);
      return NextResponse.json({ error: 'failed to create discount code' }, { status: 500 });
    }
  }

  try {
    await sendWelcomeEmail({ firstName, email, discountCode, colorway, tierPct });
  } catch (err) {
    console.error('[approve-ambassador] Welcome email error:', err);
    return NextResponse.json({ error: 'failed to send welcome email' }, { status: 500 });
  }

  await supabase
    .from('ambassador_applications')
    .update({ approved: true, status: 'approved', discount_code: discountCode, tier_pct: tierPct })
    .eq('id', applicationId);

  return NextResponse.json({ ok: true, discountCode });
}
