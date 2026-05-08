import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { resend } from '@/lib/email/resend-client';
import { sendApplicationConfirmation } from '@/lib/email/send-application-confirmation';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, instagram, school, accountType, followers, message, shippingAddress, colorwayPreference } = body ?? {};

  if (!name || !email || !instagram || !school) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  // Save to Supabase
  const supabase = createSupabaseServiceClient();
  const { error: dbError } = await supabase.from('ambassador_applications').insert({
    name, email, instagram, school,
    account_type: accountType ?? null,
    followers: followers ?? null,
    message: message ?? null,
    shipping_address: shippingAddress ?? null,
    colorway_preference: colorwayPreference ?? null,
  });
  if (dbError) console.error('[partners] DB insert error:', dbError.message, dbError.details, dbError.hint);

  if (process.env.RESEND_API_KEY) {
    try {
      const notifyEmail = process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co';

      // Notify the Good Kicks team
      await resend.emails.send({
        from: 'Good Kicks <info@goodkicks.co>',
        to: notifyEmail,
        replyTo: email,
        subject: `New Ambassador Application — ${instagram} (${school})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1917">
            <h2 style="font-size:22px;margin-bottom:4px">New Ambassador Application</h2>
            <p style="color:#6B6B6B;margin:0 0 24px;font-size:14px">submitted via goodkicks.co/ambassadors</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#6B6B6B;width:140px">Name</td><td style="padding:8px 0;font-weight:500">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#C66A3D">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">Instagram</td><td style="padding:8px 0"><a href="https://instagram.com/${instagram.replace('@','')}" style="color:#C66A3D">${instagram}</a></td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">School</td><td style="padding:8px 0">${school}</td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">Account type</td><td style="padding:8px 0">${accountType ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">Followers</td><td style="padding:8px 0">${followers ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B">Colorway</td><td style="padding:8px 0">${colorwayPreference ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#6B6B6B;vertical-align:top">Ship to</td><td style="padding:8px 0;white-space:pre-line">${shippingAddress ?? '—'}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:20px 0" />
            <p style="color:#6B6B6B;font-size:13px;margin-bottom:4px">their message:</p>
            <p style="background:#F5EFE3;padding:16px;border-radius:8px;font-size:14px;margin:0">${message ?? '—'}</p>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:20px 0" />
            <p style="color:#6B6B6B;font-size:12px">Reply to this email to respond directly to the applicant.</p>
          </div>
        `,
      });

      // Auto-reply to applicant (plain text)
      await sendApplicationConfirmation({ firstName: name.split(' ')[0], email });
    } catch (err) {
      console.error('[partners] Email error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
