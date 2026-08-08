import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';


function buildText({ headline, bodyText, ctaText, ctaUrl }: {
  headline: string; bodyText: string; ctaText?: string; ctaUrl?: string;
}): string {
  const lines = [`${headline}\n`, bodyText];
  if (ctaText && ctaUrl) lines.push(`\n${ctaText}: ${ctaUrl}`);
  lines.push('\n---\nGood Kicks · goodkicks.co\nTo unsubscribe, reply with "unsubscribe" in the subject.');
  return lines.join('\n');
}

export function buildCampaignHtml({ headline, bodyText, ctaText, ctaUrl, preheader }: {
  headline: string; bodyText: string; ctaText?: string; ctaUrl?: string; preheader?: string;
}): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim().replace(/\n/g, '<br>'))
    .filter(Boolean)
    .map((p) => `<p class="p">${p}</p>`)
    .join('');

  const cta = ctaText && ctaUrl
    ? `<div class="cta-wrap"><a href="${ctaUrl}" class="cta">${ctaText}</a></div>`
    : '';

  const pre = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#F5EFE3;mso-hide:all">${preheader}&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Good Kicks</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, #body { margin: 0; padding: 0; background: #F5EFE3; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .wrap { width: 100%; background: #F5EFE3; padding: 24px 16px; box-sizing: border-box; }
    .email { max-width: 600px; margin: 0 auto; background: #FFFDF8; border-radius: 12px; overflow: hidden; }
    .hdr { background: #C0541A; padding: 22px 32px; }
    .hdr-logo { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; color: #ffffff; font-weight: bold; letter-spacing: -0.5px; text-decoration: none; }
    .bdy { padding: 40px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 30px; margin: 0 0 24px 0; color: #1C1917; font-weight: normal; line-height: 1.25; }
    .p { margin: 0 0 18px 0; color: #57534E; line-height: 1.75; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .cta-wrap { margin: 32px 0; }
    .cta { background: #C0541A; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .ftr { border-top: 1px solid #E5DDD0; padding: 24px 32px; background: #FAF7F2; }
    .ftr-p { color: #78716C; font-size: 12px; margin: 0; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 620px) {
      .wrap { padding: 0 !important; }
      .email { border-radius: 0 !important; }
      .hdr { padding: 18px 20px !important; }
      .hdr-logo { font-size: 22px !important; }
      .bdy { padding: 28px 20px !important; }
      .h1 { font-size: 24px !important; line-height: 1.3 !important; }
      .p { font-size: 15px !important; }
      .cta { display: block !important; text-align: center !important; padding: 16px 20px !important; }
      .ftr { padding: 20px !important; }
    }
  </style>
</head>
<body id="body">
${pre}
<div class="wrap">
  <div class="email">
    <div class="hdr">
      <span class="hdr-logo">good kicks.</span>
    </div>
    <div class="bdy">
      <h1 class="h1">${headline}</h1>
      ${paragraphs}
      ${cta}
    </div>
    <div class="ftr">
      <p class="ftr-p">
        Good Kicks &nbsp;&middot;&nbsp; <a href="https://goodkicks.co" style="color:#C0541A;text-decoration:none">goodkicks.co</a><br>
        You received this because you signed up or placed an order with us.<br>
        <a href="mailto:info@goodkicks.co?subject=Unsubscribe" style="color:#78716C">Unsubscribe</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;
}

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

  const supabase = createSupabaseServiceClient();
  const { data: campaign, error: fetchErr } = await supabase
    .from('campaigns').select('*').eq('id', id).single();
  if (fetchErr || !campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  let query = supabase.from('contacts').select('email, name');
  if (campaign.recipient_mode === 'individual' && campaign.emails?.length > 0) {
    query = query.in('email', campaign.emails);
  } else if (campaign.recipient_mode === 'segment' && campaign.sources?.length > 0) {
    query = query.overlaps('sources', campaign.sources);
  }
  const { data: contacts, error: contactsErr } = await query;
  if (contactsErr) return Response.json({ error: contactsErr.message }, { status: 500 });
  if (!contacts || contacts.length === 0) return Response.json({ error: 'No contacts match recipients' }, { status: 400 });

  const html = campaign.custom_html ?? buildCampaignHtml({
    headline: campaign.headline ?? '',
    bodyText: campaign.body_text ?? '',
    ctaText: campaign.cta_text ?? undefined,
    ctaUrl: campaign.cta_url ?? undefined,
    preheader: campaign.preheader ?? undefined,
  });

  const text = campaign.custom_html ? undefined : buildText({
    headline: campaign.headline ?? '',
    bodyText: campaign.body_text ?? '',
    ctaText: campaign.cta_text ?? undefined,
    ctaUrl: campaign.cta_url ?? undefined,
  });

  const resend = new Resend(resendKey);
  const CHUNK = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK);
    const batchResult = await resend.batch.send(
      chunk.map((c) => ({
        from: 'Good Kicks <info@goodkicks.co>',
        to: c.email,
        subject: campaign.subject,
        html,
        ...(text ? { text } : {}),
        headers: {
          'List-Unsubscribe': '<mailto:info@goodkicks.co?subject=Unsubscribe>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }))
    );
    if (!batchResult.data) {
      failed += chunk.length;
    } else {
      sent += chunk.length;
      const batchIds = (batchResult.data as unknown as { data: { id: string }[] }).data;
      const rows = chunk.map((c, i) => ({
        campaign_id: id,
        email: c.email,
        contact_name: c.name ?? null,
        resend_id: batchIds[i].id,
        status: 'sent',
      }));
      await supabase.from('campaign_sends').insert(rows);
    }
  }

  await supabase.from('campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: sent,
    failed_count: failed,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  return Response.json({ sent, failed });
}
