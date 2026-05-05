import { resend } from './resend-client';

const TEMPLATE = `hey {{first_name}}, welcome to the team. ✌️

you're officially a Good Kicks ambassador. your {{colorway}} sack is on its way.

here's your personal discount code:

{{discount_code}}

use it yourself or share it with your circle — everyone who uses it gets {{tier_pct}}% off, and you earn credit toward your next sack.

a few things to know:
- post your sack in action and tag @goodkicksco
- use #goodkicks so we can find and repost your content
- reply to this email anytime with questions

make the circle bigger.

— The Good Kicks Team
goodkicks.co`;

function safeEmail(email: string) {
  return process.env.NODE_ENV === 'production' ? email : 'delivered@resend.dev';
}

export async function sendWelcomeEmail({
  firstName,
  email,
  discountCode,
  colorway,
  tierPct,
}: {
  firstName: string;
  email: string;
  discountCode: string;
  colorway: string;
  tierPct: number;
}) {
  const text = TEMPLATE
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{discount_code\}\}/g, discountCode)
    .replace(/\{\{colorway\}\}/g, colorway)
    .replace(/\{\{tier_pct\}\}/g, String(tierPct));

  await resend.emails.send({
    from: 'Good Kicks <orders@goodkicks.co>',
    to: safeEmail(email),
    replyTo: 'goodkicksfootbags@gmail.com',
    subject: `welcome to the team, ${firstName}. ✌️`,
    text,
  });
}
