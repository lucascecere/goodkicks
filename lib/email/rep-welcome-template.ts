// The Townies Town Rep welcome email body.
//
// Pure — no Resend import — so the admin can render an exact preview client-side
// instead of keeping a second copy of the copy that drifts out of sync (which is
// what happened with the Good Kicks template).

import { SITE_URL } from '@/lib/seo/site';
import { parseTowns, formatTownList, hatPhrase } from '@/lib/reps/towns';

const TEMPLATE = `hey {{first_name}} — you're officially a Townies Town Rep.

you're repping {{town}}. here's everything you need.

────────────────────────
your code: {{discount_code}}
────────────────────────

anyone who uses it gets {{discount_pct}}% off any Townies hat. you earn {{commission_pct}}% commission on every order that comes through it — paid out monthly via Venmo or PayPal.

{{hat_line}}

━━━ THE THREE THINGS WE ASK ━━━

1. link in bio
   your code link lives in your bio. that's your storefront.

2. code in bio
   add this line so nobody has to ask:
   "Townies rep | use code {{discount_code}}"

3. tag us when you post
   tag @townies.shop and use #townies on anything with the hat in it. doesn't need to be a whole production — a story, a tag, a caption. just stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this. it's live — every order your code drives, revenue, and commission earned:

{{stats_url}}

━━━ WHAT'S NEXT ━━━

1. drop your code in your bio today
{{post_line}}
3. keep repping your town — that's the whole job

questions? just reply to this email. a real person reads it.

— Townies
{{site_url}} | @townies.shop`;

const TEMPLATE_MINOR = `hey {{first_name}} — you're officially a Townies Town Rep.

you're repping {{town}}. here's everything you need.

────────────────────────
your code: {{discount_code}}
────────────────────────

anyone who uses it gets {{discount_pct}}% off any Townies hat. because you're under 18, you earn {{commission_pct}}% back as store credit on every order through your code — good on anything we make, applied monthly.

{{hat_line}}

━━━ THE THREE THINGS WE ASK ━━━

1. link in bio
   your code link lives in your bio. that's your storefront.

2. code in bio
   add this line so nobody has to ask:
   "Townies rep | use code {{discount_code}}"

3. tag us when you post
   tag @townies.shop and use #townies on anything with the hat in it. doesn't need to be a whole production — a story, a tag, a caption. just stay consistent.

━━━ YOUR STATS PAGE ━━━

bookmark this. it's live — every order your code drives, revenue, and credit earned:

{{stats_url}}

━━━ WHAT'S NEXT ━━━

1. drop your code in your bio today
{{post_line}}
3. keep repping your town — that's the whole job

questions? just reply to this email — get a parent or guardian to weigh in on anything money-related.

— Townies
{{site_url}} | @townies.shop`;

export type RepWelcomeFields = {
  firstName: string;
  town: string;
  discountCode: string;
  discountPct: number;
  commissionPct: number;
  isMinor?: boolean;
  /** True when they already have the hat — e.g. handed over in person. */
  hatDelivered?: boolean;
};

// Reps signed up face-to-face already have their hat in hand, so promising one
// "on its way" reads as a mistake and invites a "where is it?" reply. A rep
// covering more than one town gets plural wording — naming one of their towns
// would be wrong, and listing all of them reads like a form letter.
function hatLine(towns: string[], hatDelivered: boolean): string {
  const hat = hatPhrase(towns);
  const plural = towns.length > 1;
  if (hatDelivered) {
    return plural
      ? `you've already got ${hat} — those are on us. wear them, post them, that's the whole point.`
      : `you've already got ${hat} — that one's on us. wear it, post it, that's the whole point.`;
  }
  return plural
    ? `${hat} are on their way, free. those are yours to keep and to post in.`
    : `${hat} is on its way, free. that's yours to keep and to post in.`;
}

function postLine(towns: string[], hatDelivered: boolean): string {
  const plural = towns.length > 1;
  if (hatDelivered) {
    return `2. get ${plural ? 'the hats' : 'the hat'} on camera this week, tag @townies.shop`;
  }
  return plural
    ? '2. post the hats when they land, tag @townies.shop'
    : '2. post the hat when it lands, tag @townies.shop';
}

export function repWelcomeSubject(firstName: string): string {
  return `you're a Townies rep, ${firstName}.`;
}

export function renderRepWelcome({
  firstName,
  town,
  discountCode,
  discountPct,
  commissionPct,
  isMinor = false,
  hatDelivered = false,
}: RepWelcomeFields): string {
  const template = isMinor ? TEMPLATE_MINOR : TEMPLATE;
  const towns = parseTowns(town);
  return template
    .replace(/\{\{hat_line\}\}/g, hatLine(towns, hatDelivered))
    .replace(/\{\{post_line\}\}/g, postLine(towns, hatDelivered))
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{town\}\}/g, formatTownList(towns) || 'your town')
    .replace(/\{\{discount_code\}\}/g, discountCode)
    .replace(/\{\{discount_pct\}\}/g, String(discountPct))
    .replace(/\{\{commission_pct\}\}/g, String(commissionPct))
    .replace(/\{\{stats_url\}\}/g, `${SITE_URL}/ambassador/${discountCode.toLowerCase()}`)
    .replace(/\{\{site_url\}\}/g, SITE_URL.replace(/^https?:\/\//, ''));
}
