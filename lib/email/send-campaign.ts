// The one campaign sender, shared by the admin "Send" button
// (app/api/admin/campaigns/[id]/send) and the scheduled-send cron
// (app/api/cron/scheduled-campaigns). Everything a send does lives here so
// the two can't drift: unsubscribed contacts excluded, recipient_mode /
// audience_brands / exclude_buyers (refuse when Shopify can't be read), the
// From address (Townies mail only via TOWNIES_FROM), postal address and
// unsubscribe injection, campaign_sends rows, and ?test= sends.
//
// A real (non-test) send first CLAIMS the row, draft -> 'sending', in one
// conditional update. Whoever loses that race sends nothing, so a click and a
// cron run (or two cron runs) can never double-send. A send that gets nothing
// out puts the row back to 'draft'.

import { Resend } from 'resend';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
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
  lines.push(`\n---\n${chrome.name} · ${chrome.site}\n${chrome.address}\nUnsubscribe: ${UNSUB}`);
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
        ${chrome.address}<br>
        You received this because you signed up or placed an order with us.<br>
        <a href="${UNSUB}" style="color:#78716C">Unsubscribe</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export type SendCampaignResult =
  | { ok: true; sent: number; failed: number; test: boolean }
  | {
      ok: false;
      /** HTTP status for the admin route. */
      status: number;
      error: string;
      /** Worth retrying later (Shopify or Resend trouble), vs. a problem with the campaign itself. */
      transient: boolean;
    };

export type SendCampaignOptions = {
  /** Send this campaign to one address only: nothing recorded, the campaign stays a draft. */
  testTo?: string | null;
  /** Scheduled sends only claim a draft whose scheduled_for is at or before this ISO time. */
  dueBy?: string;
};

type Supabase = ReturnType<typeof createSupabaseServiceClient>;

/** Give a claimed campaign back (nothing went out). Status only, so it never depends on newer columns. */
async function release(supabase: Supabase, id: string) {
  const { error } = await supabase.from('campaigns').update({ status: 'draft' }).eq('id', id).eq('status', 'sending');
  if (error) console.error('[send-campaign] could not release claim on', id, error.message);
}

export async function sendCampaign(id: string, opts: SendCampaignOptions = {}): Promise<SendCampaignResult> {
  const testTo = opts.testTo ?? null;
  const fail = (status: number, error: string, transient = false): SendCampaignResult => ({ ok: false, status, error, transient });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return fail(500, 'RESEND_API_KEY not configured', true);

  const supabase = createSupabaseServiceClient();
  const { data: campaign, error: fetchErr } = await supabase
    .from('campaigns').select('*').eq('id', id).single();
  if (fetchErr || !campaign) return fail(404, 'Campaign not found');

  // Claim it. Only a draft can be claimed; a scheduled send also needs it to
  // still be due (an admin may have cancelled or moved the schedule since the
  // cron listed it).
  if (!testTo) {
    let claim = supabase.from('campaigns').update({ status: 'sending' }).eq('id', id).eq('status', 'draft');
    if (opts.dueBy) claim = claim.lte('scheduled_for', opts.dueBy);
    const { data: claimed, error: claimErr } = await claim.select('id');
    if (claimErr) return fail(500, claimErr.message, true);
    if (!claimed?.length) {
      return fail(409, opts.dueBy ? 'No longer due (cancelled, moved, or already sent).' : 'This campaign is already sending or has been sent.');
    }
  }

  // From here on a real send holds the claim: every early exit releases it.
  const bail = async (status: number, error: string, transient = false) => {
    if (!testTo) await release(supabase, id);
    return fail(status, error, transient);
  };

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
  if (contactsErr) return bail(500, contactsErr.message, true);
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
      return bail(502, 'Could not check Shopify for past buyers. Nothing was sent; try again.', true);
    }
    contacts = contacts.filter(
      (c) => !(c.sources ?? []).includes('order') && !buyers.has(c.email.trim().toLowerCase()),
    );
  }
  if (testTo) contacts = [{ email: testTo, name: null, sources: [] }];
  if (contacts.length === 0) return bail(400, 'No contacts match recipients');

  const personal = campaign.content_mode === 'personal';
  const html = personal ? buildPersonalHtml(campaign.body_text ?? '', UNSUB, chrome.address) : campaign.custom_html ?? buildCampaignHtml({
    headline: campaign.headline ?? '',
    bodyText: campaign.body_text ?? '',
    ctaText: campaign.cta_text ?? undefined,
    ctaUrl: campaign.cta_url ?? undefined,
    preheader: campaign.preheader ?? undefined,
    brand: campaign.brand,
  });

  const text = personal ? buildPersonalText(campaign.body_text ?? '', UNSUB, chrome.address) : campaign.custom_html ? undefined : buildText({
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
  // Same for the postal address: an uploaded email without it gets one.
  const withAddress = html.includes(chrome.address)
    ? html
    : html.replace(/<\/body>/i, `<p style="text-align:center;font:11px Arial,sans-serif;color:#78716C;margin:12px 0">${chrome.address}</p></body>`);
  const htmlWithUnsub = withAddress.includes(UNSUB)
    ? withAddress
    : withAddress.replace(/<\/body>/i, `<p style="text-align:center;font:12px Arial,sans-serif;color:#78716C;margin:16px 0"><a href="${UNSUB}" style="color:#78716C">Unsubscribe</a></p></body>`);
  const fallback = `mailto:${chrome.email}?subject=Unsubscribe`;

  const resend = new Resend(resendKey);
  const CHUNK = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK);
    let batchResult: Awaited<ReturnType<typeof resend.batch.send>>;
    try {
      batchResult = await resend.batch.send(
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
    } catch (err) {
      // A thrown batch (network) counts as failed, same as a refused one, so
      // the claim is always settled below instead of stuck on 'sending'.
      console.error('[campaign send] batch threw:', err);
      failed += chunk.length;
      continue;
    }
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

  if (testTo) return { ok: true, sent, failed, test: true };

  if (sent === 0) {
    return bail(502, `Nothing went out: the email service refused all ${failed} message${failed === 1 ? '' : 's'}. The campaign is still a draft.`, true);
  }

  const now = new Date().toISOString();
  const { error: doneErr } = await supabase.from('campaigns').update({
    status: 'sent',
    sent_at: now,
    sent_count: sent,
    failed_count: failed,
    updated_at: now,
  }).eq('id', id);
  if (doneErr) console.error('[send-campaign] sent but could not mark', id, 'as sent:', doneErr.message);

  return { ok: true, sent, failed, test: false };
}
