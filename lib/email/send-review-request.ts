import 'server-only';
import { sendEmail } from './resend-client';
import { chromeFor } from './campaign-chrome';
import { TOWNIES_FROM } from './send-rep-welcome';

/**
 * "How's the hat?" — the one email we send after an order arrives.
 *
 * Asks for an opinion and nothing else. No discount for a review: paying for
 * one buys a better rating rather than an honest one, and a review bought with
 * a coupon is the kind we've already decided not to have.
 *
 * Sent once, seven days after fulfilment, to the person who bought that order.
 */
export async function sendReviewRequestEmail({
  to,
  name,
  brand,
  productTitle,
  token,
}: {
  to: string;
  name?: string | null;
  brand: string;
  productTitle?: string | null;
  token: string;
}): Promise<string> {
  const chrome = chromeFor(brand);
  const isTownies = brand !== 'goodkicks';
  const from = isTownies ? TOWNIES_FROM : `Good Kicks <${chrome.email}>`;
  const link = `${chrome.url}/review/${token}`;
  const item = productTitle?.trim() || (isTownies ? 'your hat' : 'your foot bag');
  const hello = name?.trim()?.split(' ')[0] ?? 'Hey';

  const subject = isTownies ? `How's the hat?` : `How are the kicks?`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:${chrome.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${chrome.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr><td style="background:${chrome.header};padding:20px 28px;">
          <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">${chrome.wordmark}</span>
        </td></tr>
        <tr><td style="padding:32px 28px 8px 28px;">
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#0D1B2A;">${hello} —</p>
          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#0D1B2A;">
            ${item} should have been with you about a week now. How is it?
          </p>
          <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#0D1B2A;">
            If you've got thirty seconds, tell us what you think — good or bad. We
            read all of them, and the good ones end up on the site.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${chrome.accent};border-radius:2px;">
            <a href="${link}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;">Leave a review</a>
          </td></tr></table>
          <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:#5C6168;">
            Not a fan? Reply to this email instead and we'll sort it out.
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 28px 28px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8F918D;border-top:1px solid #E0DCD2;padding-top:16px;">
            ${chrome.name} · <a href="${chrome.url}" style="color:#8F918D;">${chrome.site}</a><br>
            You're getting this once because you ordered from us. That's the only one.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${hello} —

${item} should have been with you about a week now. How is it?

If you've got thirty seconds, tell us what you think — good or bad. We read all
of them, and the good ones end up on the site.

Leave a review: ${link}

Not a fan? Reply to this email instead and we'll sort it out.

${chrome.name} · ${chrome.site}
You're getting this once because you ordered from us. That's the only one.`;

  return sendEmail({ from, to, subject, html, text, replyTo: chrome.email });
}
