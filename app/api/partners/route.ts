import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, instagram, school, accountType, followers, message, shippingAddress, colorwayPreference } = body ?? {};

  if (!name || !email || !instagram || !school) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  // Save to Supabase
  try {
    const supabase = createSupabaseServiceClient();
    await supabase.from('ambassador_applications').insert({
      name, email, instagram, school,
      account_type: accountType ?? null,
      followers: followers ?? null,
      message: message ?? null,
      shipping_address: shippingAddress ?? null,
      colorway_preference: colorwayPreference ?? null,
    });
  } catch (err) {
    console.error('[partners] DB insert error:', err);
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const notifyEmail = process.env.PARTNER_NOTIFICATION_EMAIL ?? 'goodkicksfootbags@gmail.com';

      // Notify the Good Kicks team
      await resend.emails.send({
        from: 'Good Kicks <orders@goodkicks.co>',
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

      // Auto-reply to applicant
      await resend.emails.send({
        from: 'Good Kicks <orders@goodkicks.co>',
        to: email,
        subject: 'we got your application. ✌️',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1C1917;background:#F5EFE3;padding:40px 32px;border-radius:12px">
            <h2 style="font-family:Georgia,serif;font-size:26px;margin:0 0 8px;font-weight:400">application received.</h2>
            <p style="color:#6B6B6B;margin:0 0 20px">hey ${name.split(' ')[0]}, thanks for applying to the Good Kicks ambassador program.</p>
            <p style="color:#6B6B6B;margin:0 0 20px">we review every application personally and will get back to you within a few days. in the meantime, keep the circle going.</p>
            <div style="background:#1A1A1A;border-radius:10px;padding:20px 24px;margin-bottom:24px">
              <p style="color:#D9D2C2;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px">your application</p>
              <p style="color:#F5EFE3;font-size:15px;margin:0">${instagram} · ${school}</p>
            </div>
            <p style="color:#6B6B6B;font-size:13px;margin:0">questions? reply to this email.</p>
            <p style="color:#6B6B6B;font-size:13px;margin:8px 0 0">— The Good Kicks Team</p>
          </div>
        `,
      });
    } catch (err) {
      console.error('[partners] Email error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
