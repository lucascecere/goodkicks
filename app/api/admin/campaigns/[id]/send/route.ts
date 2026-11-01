import { NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';
import { chromeFor, type CampaignChrome } from '@/lib/email/campaign-chrome';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';
import { unsubscribeUrl } from '@/lib/email/unsubscribe';
import { buildPersonalHtml, buildPersonalText } from '@/lib/email/personal-email';
import { shopifyBuyerEmails } from '@/lib/shopify/buyer-emails';

// Per-recipient one-click unsubscribe link, swapped in at send time.
const UNSUB = '{{UNSUB_URL}}';


function buildText({ headline, bodyText, ctaText, ctaUrl, chrome }: {
  headline: string; bodyText: string; ctaText?: string; ctaUrl?: string; chrome: CampaignChrome;
}): string {
  const lines = [`${headline}\n`, bodyText];
  if (ctaText && ctaUrl) lines.push(`\n${ctaText}: ${ctaUrl}`);
  lines.push(`\n---\n${chrome.name} · ${chrome.site}\nUnsubscribe: ${UNSUB}`);
  return lines.join('\n');
}

function buildCampaignHtml({ headline, bodyText, ctaText, ctaUrl, preheader, brand }: {
  headline: string; bodyText: string; ctaText?: string; ctaUrl?: string; preheader?: string; brand?: string;
}): string {
  const chrome = chromeFor(brand);
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
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${chrome.bg};mso-hide:all">${preheader}&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${chrome.name}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body, #body { margin: 0; padding: 0; background: ${chrome.bg}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .wrap { width: 100%; background: ${chrome.bg}; padding: 24px 16px; box-sizing: border-box; }
    .email { max-width: 600px; margin: 0 auto; background: #FFFDF8; border-radius: 12px; overflow: hidden; }
    .hdr { background: ${chrome.header}; padding: 22px 32px; }
    .hdr-logo { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; color: #ffffff; font-weight: bold; letter-spacing: -0.5px; text-decoration: none; }
    .bdy { padding: 40px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 30px; margin: 0 0 24px 0; color: #1C1917; font-weight: normal; line-height: 1.25; }
    .p { margin: 0 0 18px 0; color: #57534E; line-height: 1.75; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .cta-wrap { margin: 32px 0; }
    .cta { background: ${chrome.accent}; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
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
      <span class="hdr-logo">${chrome.wordmark}</span>
    </div>
    <div class="bdy">
      <h1 class="h1">${headline}</h1>
      ${paragraphs}
      ${cta}
    </div>
    <div class="ftr">
      <p class="ftr-p">
        ${chrome.name} &nbsp;&middot;&nbsp; <a href="${chrome.url}" style="color:${chrome.accent};text-decoration:none">${chrome.site}</a><br>
        You received this because you signed up or placed an order with us.<br>
        <a href="${UNSUB}" style="color:#78716C">Unsubscribe</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  // ?test=<email> sends this campaign to that one address only: nothing is
  // recorded and the campaign stays a draft.
  const testTo = req.nextUrl.searchParams.get('test')?.trim().toLowerCase() || null;
  if (testTo && !/^[^\s@]+@[^\s@,]+\.[a-z]{2,}$/i.test(testTo)) {
    return Response.json({ error: 'That test address does not look right.' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

  const supabase = createSupabaseServiceClient();
  const { data: campaign, error: fetchErr } = await supabase
    .from('campaigns').select('*').eq('id', id).single();
  if (fetchErr || !campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });

  const chrome = chromeFor(campaign.brand);

  // Unsubscribed people never get campaign mail.
  let query = supabase.from('contacts').select('email, name, sources').is('unsubscribed_at', null);
  if (campaign.recipient_mode === 'individual' && campaign.emails?.length > 0) {
    query = query.in('email', campaign.emails);
  } else if (campaign.recipient_mode === 'segment' && campaign.sources?.length > 0) {
    query = query.overlaps('sources', campaign.sources);
  } else {
    // "Everyone" means people who bought or signed up. A contact-form or
    // request-a-town message alone isn't a yes to marketing mail (and that
    // form collects bot spam).
    query = query.overlaps('sources', ['order', 'discount', 'newsletter']);
  }
  // Audience brand is a separate axis from the SENDING brand, and additive to
  // the source filter above. Empty = no brand filter, which is what every
  // campaign did before this column existed.
  if (campaign.audience_brands?.length > 0) {
    query = query.overlaps('brands', campaign.audience_brands);
  }
  const { data: matched, error: contactsErr } = await query;
  if (contactsErr) return Response.json({ error: contactsErr.message }, { status: 500 });
  let contacts = matched ?? [];

  // "Haven't bought yet": drop anyone tagged with an order AND anyone Shopify
  // has an order for. If Shopify can't be read, refuse rather than risk
  // telling a customer they've never ordered.
  if (campaign.exclude_buyers && !testTo) {
    let buyers: Set<string>;
    try {
      buyers = await shopifyBuyerEmails();
    } catch (err) {
      console.error('[campaign send] buyer lookup failed:', err);
      return Response.json({ error: 'Could not check Shopify for past buyers. Nothing was sent; try again.' }, { status: 502 });
    }
    contacts = contacts.filter(
      (c) => !(c.sources ?? []).includes('order') && !buyers.has(c.email.trim().toLowerCase()),
    );
  }
  if (testTo) contacts = [{ email: testTo, name: null, sources: [] }];
  if (contacts.length === 0) return Response.json({ error: 'No contacts match recipients' }, { status: 400 });

  const personal = campaign.content_mode === 'personal';
  const html = personal ? buildPersonalHtml(campaign.body_text ?? '', UNSUB) : campaign.custom_html ?? buildCampaignHtml({
    headline: campaign.headline ?? '',
    bodyText: campaign.body_text ?? '',
    ctaText: campaign.cta_text ?? undefined,
    ctaUrl: campaign.cta_url ?? undefined,
    preheader: campaign.preheader ?? undefined,
    brand: campaign.brand,
  });

  const text = personal ? buildPersonalText(campaign.body_text ?? '', UNSUB) : campaign.custom_html ? undefined : buildText({
    headline: campaign.headline ?? '',
    bodyText: campaign.body_text ?? '',
    ctaText: campaign.cta_text ?? undefined,
    ctaUrl: campaign.cta_url ?? undefined,
    chrome,
  });

  // Townies mail goes out under TOWNIES_FROM, which respects TOWNIES_FROM_EMAIL
  // and falls back to the Good Kicks address while townies.shop is unverified in
  // Resend. Hardcoding a townies.shop sender here would make every send fail.
  const from = campaign.brand === 'goodkicks'
    ? 'Good Kicks <info@goodkicks.co>'
    : personal
      // A personal email comes from a person: "Lucas at Townies <info@…>".
      ? TOWNIES_FROM.replace(/^Townies </, 'Lucas at Townies <')
      : TOWNIES_FROM;

  // custom_html written before this existed has no placeholder: add a footer link.
  const htmlWithUnsub = html.includes(UNSUB)
    ? html
    : html.replace(/<\/body>/i, `<p style="text-align:center;font:12px Arial,sans-serif;color:#78716C;margin:16px 0"><a href="${UNSUB}" style="color:#78716C">Unsubscribe</a></p></body>`);
  const fallback = `mailto:${chrome.email}?subject=Unsubscribe`;

  const resend = new Resend(resendKey);
  const CHUNK = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK);
    const batchResult = await resend.batch.send(
      chunk.map((c) => {
        const link = unsubscribeUrl(chrome.url, c.email);
        return {
          from,
          to: c.email,
          subject: testTo ? `[Test] ${campaign.subject}` : campaign.subject,
          html: htmlWithUnsub.replaceAll(UNSUB, link ?? fallback),
          ...(text ? { text: text.replaceAll(UNSUB, link ?? fallback) } : {}),
          headers: (link
            ? { 'List-Unsubscribe': `<${link}>, <${fallback}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
            : { 'List-Unsubscribe': `<${fallback}>` }) as Record<string, string>,
        };
      })
    );
    if (!batchResult.data) {
      failed += chunk.length;
    } else {
      sent += chunk.length;
      if (testTo) continue;
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

  if (testTo) return Response.json({ sent, failed, test: true });

  await supabase.from('campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: sent,
    failed_count: failed,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  return Response.json({ sent, failed });
}
