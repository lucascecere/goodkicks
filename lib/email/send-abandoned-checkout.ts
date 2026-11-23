import 'server-only';
import { sendEmail } from './resend-client';
import { CAMPAIGN_CHROME } from './campaign-chrome';
import { TOWNIES_FROM } from './send-rep-welcome';
import { unsubscribeUrl } from './unsubscribe';
import type { AbandonedLine } from '@/lib/shopify/abandoned-checkouts';

// The one email an abandoned Townies checkout gets.
//   offer = a fresh BACK5 code → "$5 off to finish it", code applied by the link.
//   offer = null → they already had a promo on it, so a plain "we saved your cart".
// Always from info@townies.shop (never a YWF domain), branded like the campaign
// emails, with the postal address and a one-click unsubscribe.

const C = CAMPAIGN_CHROME.townies;
const LOGO = `${C.url}/brand/logos/script-cream.png`;
const INK = '#0D1B2A';
const MUTED = '#5C6168';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function img(url: string, width: number): string {
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
}

/** "your Dorchester Lifestyle Hat" / "your 2 hats" */
export function cartPhrase(lines: AbandonedLine[]): string {
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  if (lines.length === 1 && count === 1) return `your ${lines[0].title}`;
  return `your ${count} ${lines.every((l) => /hat/i.test(l.title)) ? 'hats' : 'items'}`;
}

export function abandonedSubject(lines: AbandonedLine[], hasOffer: boolean, deal = false): string {
  if (deal) return 'Your hats are still $25 each';
  const what = lines.length === 1 && lines[0].quantity === 1 ? lines[0].title.replace(/^The /, '') : 'cart';
  return hasOffer ? `$5 off to finish your ${what}` : `Your ${what} is still saved`;
}

export function renderAbandonedEmail(opts: {
  email: string;
  firstName: string | null;
  lines: AbandonedLine[];
  link: string;
  offer: { code: string; expiresAt: string } | null;
  /** 2+ hats: the two-town deal applies at checkout. */
  deal?: boolean;
}): { subject: string; html: string; text: string; unsubscribe: string } {
  const { firstName, lines, link, offer } = opts;
  const deal = Boolean(opts.deal) && !offer;
  const hello = firstName ? `Hey ${esc(firstName)},` : 'Hey,';
  const phrase = esc(cartPhrase(lines));
  const subject = abandonedSubject(lines, Boolean(offer), deal);
  const unsub = unsubscribeUrl(C.url, opts.email) ?? `mailto:${C.email}?subject=Unsubscribe`;

  const shown = lines.filter((l) => l.imageUrl).slice(0, 2);
  const tile = (l: AbandonedLine) => `
    <td valign="top" style="padding:0 6px;" width="${shown.length > 1 ? '50%' : '100%'}">
      <img src="${esc(img(l.imageUrl!, 560))}" alt="${esc(l.title)}" width="${shown.length > 1 ? 220 : 300}" style="display:block;margin:0 auto;width:100%;max-width:${shown.length > 1 ? 220 : 300}px;height:auto;border:0;">
      <p style="margin:8px 0 0 0;font-size:13px;line-height:1.4;color:${INK};text-align:center;font-weight:600;">${esc(l.title)}${l.quantity > 1 ? ` × ${l.quantity}` : ''}</p>
    </td>`;

  const intro = offer
    ? `You were one step away from ${phrase}. We saved your cart, and here's $5 off to finish it up.`
    : deal
    ? `You were one step away from ${phrase}. We saved your cart, and the two-town deal is still on: get 2 or more hats and you save $4.99 on each, taken off at checkout.`
    : `You were one step away from ${phrase}. We saved your cart, so you can pick up right where you left off.`;

  const ticket = offer
    ? `
        <tr><td style="padding:4px 28px 20px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${C.accent};border-radius:4px;">
            <tr><td align="center" style="padding:16px 12px;">
              <p style="margin:0;font-size:26px;line-height:1.1;font-weight:800;color:${C.accent};letter-spacing:0.02em;">$5 OFF YOUR ORDER</p>
              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.5;color:${MUTED};">Code <strong style="color:${INK};letter-spacing:0.06em;">${esc(offer.code)}</strong> is added when you tap the button. Good through ${shortDate(offer.expiresAt)}.</p>
            </td></tr>
          </table>
        </td></tr>`
    : '';

  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${offer ? 'We saved your cart, plus $5 off to finish it.' : deal ? 'We saved your cart. The two-town deal is still on.' : 'We saved your cart for you.'}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:6px;overflow:hidden;">
        <tr><td align="center" style="background:${C.header};padding:22px 28px;">
          <a href="${C.url}"><img src="${LOGO}" alt="Townies" width="150" style="display:block;width:150px;height:auto;border:0;"></a>
        </td></tr>
        <tr><td style="padding:30px 28px 6px 28px;">
          <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:${INK};">${hello}</p>
          <p style="margin:0 0 20px 0;font-size:16px;line-height:1.6;color:${INK};">${intro}</p>
        </td></tr>
        ${shown.length ? `<tr><td style="padding:0 22px 20px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${shown.map(tile).join('')}</tr></table></td></tr>` : ''}
        ${ticket}
        <tr><td align="center" style="padding:0 28px 26px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.accent};border-radius:3px;">
            <a href="${esc(link)}" style="display:inline-block;padding:15px 34px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">Finish your order</a>
          </td></tr></table>
          <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${MUTED};">Questions about sizing or shipping? Just reply to this email.</p>
        </td></tr>
        <tr><td style="background:${C.header};padding:14px 28px;" align="center">
          <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#E9E3D6;">Embroidered, not printed · Designed in Massachusetts</p>
        </td></tr>
        <tr><td style="padding:18px 28px 24px 28px;">
          <p style="margin:0;font-size:11px;line-height:1.6;color:#8F918D;text-align:center;">
            ${C.name} · ${C.address} · <a href="${C.url}" style="color:#8F918D;">${C.site}</a><br>
            You're getting this once because you started a checkout with us. <a href="${esc(unsub)}" style="color:#8F918D;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    firstName ? `Hey ${firstName},` : 'Hey,',
    '',
    intro.replace(/&amp;/g, '&'),
    offer ? `\n$5 off your order: code ${offer.code} (added automatically by the link below). Good through ${shortDate(offer.expiresAt)}.` : '',
    '',
    `Finish your order: ${link}`,
    '',
    'Questions about sizing or shipping? Just reply to this email.',
    '',
    `${C.name} · ${C.address} · ${C.site}`,
    `Unsubscribe: ${unsub}`,
  ].join('\n');

  return { subject, html, text, unsubscribe: unsub };
}

export async function sendAbandonedCheckoutEmail(opts: {
  to: string;
  firstName: string | null;
  lines: AbandonedLine[];
  link: string;
  offer: { code: string; expiresAt: string } | null;
  deal?: boolean;
}): Promise<string> {
  const r = renderAbandonedEmail({ email: opts.to, ...opts });
  const fallback = `mailto:${C.email}?subject=Unsubscribe`;
  return sendEmail({
    from: TOWNIES_FROM,
    to: opts.to,
    replyTo: C.email,
    subject: r.subject,
    html: r.html,
    text: r.text,
    headers: r.unsubscribe.startsWith('http')
      ? { 'List-Unsubscribe': `<${r.unsubscribe}>, <${fallback}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      : { 'List-Unsubscribe': `<${fallback}>` },
  });
}
