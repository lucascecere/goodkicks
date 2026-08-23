import 'server-only';
import { sendEmail } from './resend-client';
import { SITE_URL } from '@/lib/seo/site';
import { CODE_VALID_DAYS, type SpinWedge } from '@/lib/townies/spin-prizes';

// Townies rotary code email.
//
// Table-based and inline-styled on purpose — Gmail strips <style> blocks and
// Outlook still lays out with tables. No web fonts either: Georgia/Arial are
// the closest universally-available stand-ins for the brand's slab and body
// faces, and a font that fails to load looks worse than one that was never
// asked for.
//
// Sender: townies.shop until Resend reports it verified, at which point set
// TOWNIES_FROM_EMAIL and this flips with no code change. Do NOT set that env
// var early — Resend rejects unverified senders and every one of these would
// bounce silently.
const FROM_EMAIL = process.env.TOWNIES_FROM_EMAIL ?? 'info@goodkicks.co';

const NAVY = '#0D1B2A';
const FOREST = '#2F4F3A';
const CREAM = '#F2EFE8';
const STONE = '#8F918D';

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

export function renderSpinCodeEmail({
  wedge,
  code,
  expiresAt,
}: {
  wedge: SpinWedge;
  code: string;
  expiresAt: string;
}): string {
  const shopUrl = `${SITE_URL}/shop`;

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your code is ${code} — ${wedge.terms}, good through ${formatExpiry(expiresAt)}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E0DCD2;">

        <!-- Masthead -->
        <tr><td style="background:${NAVY};padding:34px 32px 30px;text-align:center;">
          <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:15px;letter-spacing:5px;text-transform:uppercase;color:${CREAM};opacity:0.6;">Townies</p>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;color:#FFFFFF;">You took the rotary.</p>
          <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${CREAM};opacity:0.75;">Here is the exit you came out of.</p>
        </td></tr>

        <!-- The code -->
        <tr><td style="padding:34px 32px 8px;text-align:center;">
          <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${STONE};">${wedge.exit}</p>
          <p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1;color:${NAVY};">${wedge.label}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${FOREST};">
            <tr><td style="padding:22px 16px;text-align:center;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${STONE};">Your code</p>
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:bold;letter-spacing:3px;color:${NAVY};">${code}</p>
            </td></tr>
          </table>

          <p style="margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#5C6168;">
            ${wedge.terms}. One use, yours alone — good through <strong style="color:${NAVY};">${formatExpiry(expiresAt)}</strong>.
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:26px 32px 34px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr><td style="background:${FOREST};">
              <a href="${shopUrl}" style="display:inline-block;padding:15px 38px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">Pick your town</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:${CREAM};padding:24px 32px;text-align:center;border-top:1px solid #E0DCD2;">
          <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${NAVY};">Rooted in Massachusetts. Built for every town.</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${STONE};">
            Townies Apparel Co. &middot; <a href="${SITE_URL}" style="color:${FOREST};text-decoration:none;">townies.shop</a><br />
            You got this because you spun the rotary at townies.shop. It is the only email that spin sends.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send the code. Throws on failure — `sendEmail` turns Resend's
 * `{ data: null, error }` non-throwing failure into a real exception, so the
 * caller can tell the visitor the truth instead of showing a success screen for
 * an email that never left.
 */
export async function sendSpinCodeEmail({
  to,
  wedge,
  code,
  expiresAt,
}: {
  to: string;
  wedge: SpinWedge;
  code: string;
  expiresAt: string;
}): Promise<string> {
  return sendEmail({
    from: `Townies <${FROM_EMAIL}>`,
    to,
    subject: `${wedge.label} — your Townies code is ${code}`,
    html: renderSpinCodeEmail({ wedge, code, expiresAt }),
    text: [
      'You took the rotary.',
      '',
      `${wedge.exit} — ${wedge.label}`,
      `Code: ${code}`,
      `${wedge.terms}. One use, good through ${formatExpiry(expiresAt)} (${CODE_VALID_DAYS} days).`,
      '',
      `Shop: ${SITE_URL}/shop`,
      '',
      'Townies Apparel Co. — Rooted in Massachusetts. Built for every town.',
    ].join('\n'),
  });
}
