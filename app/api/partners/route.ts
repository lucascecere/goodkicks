import { NextRequest, NextResponse, after } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { sendEmail } from '@/lib/email/resend-client';
import { sendApplicationConfirmation } from '@/lib/email/send-application-confirmation';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';
import { parseBrand, requestBrand } from '@/lib/brand/site-brand';
import { BUYER_INTENT, judgeForm } from '@/lib/form-guard';
import { burstHold, quarantine } from '@/lib/form-quarantine';
import { captureSend, leadSiteFor, reportLead } from '@/lib/lead-monitor';
import { scoreSpam } from '@/lib/spam';

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

  // Townies is the default now — Good Kicks is the deliberate exception.
  const brand = parseBrand(body?.brand) ?? requestBrand(req);
  const isTownies = brand === 'townies';

  // Townies reps rep a town; Good Kicks ambassadors rep a school.
  const place = isTownies ? town : school;
  if (!name || !email || !instagram || !place) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  // Spam guard (lib/form-guard.ts): bots, faker leads and pitches get the same
  // { ok: true } a person does, but nothing is saved, emailed or confirmed.
  const verdict = await judgeForm({
    name: String(name),
    email: String(email),
    message: [message, followers, accountType].filter((v) => typeof v === 'string').join('\n'),
    hasDetail: true,
    token: body?._t,
    honey: body?._hp,
    buyerIntent: BUYER_INTENT.rep,
  });
  const junk = scoreSpam({ fields: [String(name), String(place), String(message ?? '')], email: String(email), submitAfterMs: 1e9 });
  if (junk.isSpam) verdict.reasons.push(...junk.reasons);
  const spamPayload = { instagram, school, town, message, followers, accountType, age };
  if (verdict.spam || junk.isSpam) {
    if (await quarantine({ form: 'rep application', brand, name, email, reasons: verdict.reasons, payload: spamPayload })) return NextResponse.json({ ok: true });
  }
  if (await burstHold('rep application', { name, email, brand }, spamPayload)) return NextResponse.json({ ok: true });

  const supabase = createSupabaseServiceClient();
  const { data: inserted, error: dbError } = await supabase.from('ambassador_applications').insert({
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
  }).select('id').maybeSingle();
  if (dbError) console.error('[partners] DB insert error:', dbError.message, dbError.details, dbError.hint);
  await upsertContact({ email, name, source: 'ambassador', brand });

  let notify: { ok: boolean; error: string | null } = { ok: false, error: 'RESEND_API_KEY not set' };
  if (process.env.RESEND_API_KEY) {
    try {
      // Townies rep applications go to the Townies inbox (Lucas 11-16); Good
      // Kicks ambassador apps stay on info@goodkicks.co (same inbox's alternate).
      const notifyEmail = isTownies ? 'info@townies.shop' : process.env.PARTNER_NOTIFICATION_EMAIL ?? 'info@goodkicks.co';
      const accent = isTownies ? '#2F4F3A' : '#C66A3D';
      const heading = isTownies ? 'New Town Rep Application' : 'New Ambassador Application';
      const sourcePath = isTownies ? 'townies.shop/ambassadors' : 'goodkicks.co/ambassadors';

      notify = await captureSend(() => sendEmail({
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
      }));
      if (!notify.ok) console.error('[partners] Inbox alert failed:', notify.error);

      await sendApplicationConfirmation({ firstName: String(name).split(' ')[0], email, brand });
    } catch (err) {
      console.error('[partners] Email error:', err);
    }
  }

  // Tell the YWF Command Center about the application and whether the inbox
  // alert went out. after() runs once the response is sent; never throws.
  after(() =>
    reportLead({
      site: leadSiteFor(brand),
      externalId: inserted?.id ?? null,
      name: String(name),
      email: String(email),
      company: String(place),
      form: isTownies ? 'town rep application' : 'ambassador application',
      summary: [`Instagram: ${instagram}`, `${isTownies ? 'Town' : 'School'}: ${place}`, followers && `Followers: ${followers}`, message]
        .filter(Boolean)
        .join('\n'),
      clientNotified: notify.ok,
      notifyError: notify.error,
    }),
  );

  return NextResponse.json({ ok: true });
}
