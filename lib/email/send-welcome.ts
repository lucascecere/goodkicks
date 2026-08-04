import fs from 'fs';
import path from 'path';
import { resend } from './resend-client';

const TEMPLATE_MINOR = `hey {{first_name}}, welcome to the Good Kicks team. ✌️

you're officially a Good Kicks ambassador. your {{colorway}} sack is on its way — no cost to you, that's your starter kit.

────────────────────────
your discount code: {{discount_code}}
────────────────────────

share this code with anyone. every time someone uses it, they get {{discount_pct}}% off — and you earn {{commission_pct}}% store credit on every order, redeemable on any good kicks purchase. the more you push it, the more credit you stack.

━━━ THE THREE REQUIREMENTS ━━━

these aren't optional — they're how the program works:

1. link in bio
   your discount code link lives in your bio. always. that's your storefront.

2. code in bio
   add this exact line to your instagram bio:
   "@goodkicksco ambassador | use code '{{discount_code}}'"
   make it dead simple for people to find it.

3. mentioned in every video
   every time you post something related to the sack, give us a shoutout. it doesn't have to be a dedicated video — just a mention, a tag, a caption. stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this link — it's your personal dashboard showing every order driven by your code, total revenue, and store credit earned in real time:

goodkicks.co/ambassador/{{discount_code_lower}}

━━━ HOW YOU GROW ━━━

your tier is based on total sales driven through your code:

  starter  → 0–9 orders    → 8% store credit  (your code: 15% off for followers)
  repping  → 10–37 orders  → 12% store credit (code bumps to 20% off)
  anchor   → 38+ orders    → 20% store credit (code stays at 20% off)

you move up automatically as your numbers grow.`;

const TEMPLATE = `hey {{first_name}}, welcome to the Good Kicks team. ✌️

you're officially a Good Kicks ambassador. your {{colorway}} sack is on its way — no cost to you, that's your starter kit.

────────────────────────
your discount code: {{discount_code}}
────────────────────────

share this code with anyone. every time someone uses it, they get {{discount_pct}}% off — and you earn {{commission_pct}}% commission on every order, paid out monthly. the more you push it, the more you earn.

━━━ THE THREE REQUIREMENTS ━━━

these aren't optional — they're how the program works:

1. link in bio
   your discount code link lives in your bio. always. that's your storefront.

2. code in bio
   add this exact line to your instagram bio:
   "@goodkicksco ambassador | use code '{{discount_code}}'"
   make it dead simple for people to find it.

3. mentioned in every video
   every time you post something related to the sack, give us a shoutout. it doesn't have to be a dedicated video — just a mention, a tag, a caption. stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this link — it's your personal dashboard showing every order driven by your code, total revenue, and commission earned in real time:

goodkicks.co/ambassador/{{discount_code_lower}}

━━━ HOW YOU GROW ━━━

your tier is based on total sales driven through your code:

  starter  → 0–9 orders    → 8% commission  (your code: 15% off for followers)
  repping  → 10–37 orders  → 12% commission (code bumps to 20% off)
  anchor   → 38+ orders    → 20% commission (code stays at 20% off)

you move up automatically as your numbers grow.

━━━ HOW TO GET STARTED ━━━

1. drop your code link in your bio today
2. add this to your instagram bio: "@goodkicksco ambassador | use code '{{discount_code}}'"
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
  commissionPct,
  discountPct,
  isMinor = false,
}: {
  firstName: string;
  email: string;
  discountCode: string;
  colorway: string;
  /** What the rep earns. Set per-rep in the admin, so the copy must follow it. */
  commissionPct: number;
  /** What the customer saves. */
  discountPct: number;
  isMinor?: boolean;
}) {
  const template = isMinor ? TEMPLATE_MINOR : TEMPLATE;
  const text = template
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{discount_code\}\}/g, discountCode)
    .replace(/\{\{discount_code_lower\}\}/g, discountCode.toLowerCase())
    .replace(/\{\{colorway\}\}/g, colorway)
    .replace(/\{\{commission_pct\}\}/g, String(commissionPct))
    .replace(/\{\{discount_pct\}\}/g, String(discountPct));

  const pamphletPath = path.join(process.cwd(), 'public', 'brand', 'ambassador-pamphlet.pdf');
  const pamphletContent = fs.readFileSync(pamphletPath);

  await resend.emails.send({
    from: 'Good Kicks <info@goodkicks.co>',
    to: safeEmail(email),
    replyTo: 'info@goodkicks.co',
    subject: `welcome to the team, ${firstName}. ✌️`,
    text,
    attachments: [
      {
        filename: 'good-kicks-ambassador-guide.pdf',
        content: pamphletContent,
      },
    ],
  });
}
