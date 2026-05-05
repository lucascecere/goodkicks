import { resend } from './resend-client';

const TEMPLATE = `hey {{first_name}}, welcome to the Good Kicks team. ✌️

you're officially a Good Kicks ambassador. your {{colorway}} sack is on its way — no cost to you, that's your starter kit.

────────────────────────
your discount code: {{discount_code}}
────────────────────────

share this code with anyone. every time someone uses it, they get {{tier_pct}}% off and you earn commission. the more you push it, the more you earn.

━━━ THE THREE REQUIREMENTS ━━━

these aren't optional — they're how the program works:

1. link in bio
   your discount code link lives in your bio. always. that's your storefront.

2. code in bio
   your discount code is pinned in your bio too. make it dead simple for people to find it.

3. mentioned in every video
   every time you post something related to the sack, give us a shoutout. it doesn't have to be a dedicated video — just a mention, a tag, a caption. stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this link — it's your personal dashboard showing every order driven by your code, total revenue, and commission earned in real time:

goodkicks.co/ambassador/{{discount_code_lower}}

━━━ HOW YOU GROW ━━━

your tier is based on total sales driven through your code:

  starter  → 0–10 orders    → {{tier_pct}}% commission
  repping  → 11–30 orders   → 20% commission
  anchor   → 31+ orders     → 30% commission + exclusive drops

you move up automatically as your numbers grow.

━━━ HOW TO GET STARTED ━━━

1. drop your code link in your bio today
2. pin your code in your bio description
3. post your sack when it arrives and tag @goodkicksco
4. use #goodkicks so we can find and repost your content
5. mention us every time you post — keep it natural, keep it consistent

that's it. no complicated rules. just keep the circle going.

questions? just reply to this email — we check it.

make the circle bigger.

— The Good Kicks Team
goodkicks.co | @goodkicksco`;

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
    .replace(/\{\{discount_code_lower\}\}/g, discountCode.toLowerCase())
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
