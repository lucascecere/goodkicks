import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { resend } from '@/lib/email/resend-client';
import { sendApplicationConfirmation } from '@/lib/email/send-application-confirmation';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';

const GK_FROM = 'Good Kicks <info@goodkicks.co>';

function row(label: string, value: string) {
  return `<tr><td style="padding:8px 0;color:#6B6B6B;width:140px">${label}</td><td style="padding:8px 0">${value}</td></tr>`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    email,
    instagram,
    school,
    town,
    hatPreference,
    accountType,
    followers,
    message,
    shippingAddress,
    colorwayPreference,
    age,
  } = body ?? {};

  const brand = body?.brand === 'townies' ? 'townies' : 'goodkicks';
  const isTownies = brand === 'townies';

  // Townies reps rep a town; Good Kicks ambassadors rep a school.
  const place = isTownies ? town : school;
  if (!name || !email || !instagram || !place) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { error: dbError } = await supabase.from('ambassador_applications').insert({
    brand,
    name,
    email,
    instagram,
    school: school ?? null,
    town: town ?? null,
    hat_preference: hatPreference ?? null,
    account_type: accountType ?? null,
    followers: followers ?? null,
    message: message ?? null,
    shipping_address: shippingAddress ?? null,
    colorway_preference: colorwayPreference ?? null,
    age: typeof age === 'number' ? age : null,
  });
  if (dbError) console.error('[partners] DB insert error:', dbError.message, dbError.details, dbError.hint);
  await upsertContact({ email, name, source: 'ambassador' });

  if (process.env.RESEND_API_KEY) {
    try {
      const notifyEmail = process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co';
      const accent = isTownies ? '#2F4F3A' : '#C66A3D';
      const heading = isTownies ? 'New Town Rep Application' : 'New Ambassador Application';
      const sourcePath = isTownies ? 'townies.shop/ambassadors' : 'goodkicks.co/ambassadors';

      await resend.emails.send({
        from: isTownies ? TOWNIES_FROM : GK_FROM,
        to: notifyEmail,
        replyTo: email,
        subject: `${heading} — ${instagram} (${place})`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1C1917">
            <h2 style="font-size:22px;margin-bottom:4px">${heading}</h2>
            <p style="color:#6B6B6B;margin:0 0 24px;font-size:14px">submitted via ${sourcePath}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              ${row('Name', `<strong>${name}</strong>`)}
              ${row('Email', `<a href="mailto:${email}" style="color:${accent}">${email}</a>`)}
              ${row('Instagram', `<a href="https://instagram.com/${String(instagram).replace('@', '')}" style="color:${accent}">${instagram}</a>`)}
              ${row(isTownies ? 'Town' : 'School', String(place))}
              ${row('Age', `${age ?? '—'}${age && age < 18 ? ` <strong style="color:${accent}">(minor — credit only)</strong>` : ''}`)}
              ${row('Account type', accountType ?? '—')}
              ${row('Followers', followers ?? '—')}
              ${row(isTownies ? 'Hat wanted' : 'Colorway', (isTownies ? hatPreference : colorwayPreference) ?? '—')}
              ${row('Ship to', `<span style="white-space:pre-line">${shippingAddress ?? '—'}</span>`)}
            </table>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:20px 0" />
            <p style="color:#6B6B6B;font-size:13px;margin-bottom:4px">their message:</p>
            <p style="background:#F5EFE3;padding:16px;border-radius:8px;font-size:14px;margin:0">${message ?? '—'}</p>
            <hr style="border:none;border-top:1px solid #E5DDD0;margin:20px 0" />
            <p style="color:#6B6B6B;font-size:12px">Reply to this email to respond directly to the applicant.</p>
          </div>
        `,
      });

      await sendApplicationConfirmation({ firstName: String(name).split(' ')[0], email, brand });
    } catch (err) {
      console.error('[partners] Email error:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
