import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { upsertContact } from '@/lib/supabase/upsert-contact';

const VALID_CODES = new Set(['KICKS10', 'KICKS15', 'KICKS20', 'FREESHIP']);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, discountCode, discountLabel } = body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  if (!discountCode || !VALID_CODES.has(discountCode)) {
    return NextResponse.json({ error: 'invalid code' }, { status: 400 });
  }

  await upsertContact({ email, source: 'discount' });

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'Good Kicks <info@goodkicks.co>',
        to: email,
        subject: `your discount code: ${discountCode}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1C1917;background:#F5EFE3;padding:40px 32px;border-radius:12px">
            <h2 style="font-family:Georgia,serif;font-size:28px;margin:0 0 8px;font-weight:400">you spun. you won. ✌️</h2>
            <p style="color:#6B6B6B;margin:0 0 32px">here's your exclusive discount code:</p>
            <div style="background:#1A1A1A;border-radius:10px;padding:24px 32px;text-align:center;margin-bottom:32px">
              <p style="color:#D9D2C2;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px">your code</p>
              <p style="color:#F5EFE3;font-family:Georgia,serif;font-size:36px;letter-spacing:6px;margin:0;font-weight:400">${discountCode}</p>
              <p style="color:#D9D2C2;font-size:13px;margin:8px 0 0">${discountLabel}</p>
            </div>
            <p style="color:#6B6B6B;font-size:14px;margin:0 0 24px">enter this code at checkout on <a href="https://goodkicks.co" style="color:#C66A3D">goodkicks.co</a> — keep the circle going.</p>
            <hr style="border:none;border-top:1px solid #D9D2C2;margin:24px 0" />
            <p style="color:#6B6B6B;font-size:12px;margin:0">Good Kicks Foot Bags · built for every backpack that needs one.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[discount] Email send failed:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
