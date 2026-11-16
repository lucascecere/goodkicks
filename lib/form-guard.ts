import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { promises as dns } from 'node:dns';

// Public form spam guard (ported from the ACoast site, 2026-11-16).
//
// Every public form on Townies / Good Kicks runs through judgeForm(). Spam is
// answered with the exact success a person sees, but sends NOTHING: no inbox
// email, no autoresponder, no discount code. It is kept in `form_spam` (with
// the reasons) so a false positive can be found and restored by hand.
//
// What it catches:
//   - bots that post straight to the endpoint (no signed form token, or one
//     used faster than a person can type), and form-filler bots (honeypot)
//   - faker.js leads with stolen emails ("Wolf, Kreiger and Corkery")
//   - sales pitches sent through the forms (SEO, VAs, funding, guest posts)
//   - bid-invite scams from days-old domains with no website
// lib/spam.ts (gibberish + dot-stuffed Gmail) still runs alongside this.

// ---------- form token: proves the form was loaded in a browser first ----------

const MIN_FILL_MS = 2_500;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function key(): Buffer {
  const base =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_SESSION_SECRET || process.env.RESEND_API_KEY || '';
  return createHmac('sha256', base).update('townies-form-token-v1').digest();
}

export function issueFormToken(now = Date.now()): string {
  const ts = String(now);
  const sig = createHmac('sha256', key()).update(ts).digest('base64url');
  return `${ts}.${sig}`;
}

export type TokenCheck = 'ok' | 'missing' | 'bad' | 'fast' | 'stale';

export function checkFormToken(token: unknown, now = Date.now()): TokenCheck {
  if (typeof token !== 'string' || !token) return 'missing';
  const [ts, sig] = token.split('.');
  if (!ts || !sig || !/^\d+$/.test(ts)) return 'bad';
  const expected = createHmac('sha256', key()).update(ts).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return 'bad';
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'bad';
  const age = now - Number(ts);
  if (age < MIN_FILL_MS) return 'fast';
  if (age > MAX_AGE_MS) return 'stale';
  return 'ok';
}

/** For endpoints with no content to judge (spin, welcome, quiz, subscribe). */
export function tokenPasses(token: unknown): boolean {
  const t = checkFormToken(token);
  return t === 'ok' || t === 'stale';
}

// ---------- content fingerprints ----------

const W = "[A-Z][a-zA-Z'’]+(?:-[A-Z][a-zA-Z'’]+)?";
const FAKER_COMPANY_MULTI = new RegExp(`^${W}(?:, ${W} and ${W}| - ${W})$`);
const FAKER_COMPANY_SUFFIX = new RegExp(`^${W} (?:LLC|Inc|Group)$`);
const FAKER_NAME_PREFIX = /^(?:Mr|Mrs|Ms|Miss|Dr)\.?\s/;
const FAKER_NAME_SUFFIX = /\s(?:I|II|III|IV|V|Jr\.?|Sr\.?|MD|DDS|DVM|PhD)$/;
const ROLE_LOCAL =
  /^(?:info|office|admin|contact|sales|hello|marketing|orders|order|shop|store|team|coach|coaches|athletics|manager|gm|accounts|billing|service|support|purchasing|operations|ops|mail|reception|director)\d*$/i;
const DISPOSABLE = new Set(['mailchuwee.com', 'mailinator.com', 'guerrillamail.com', 'yopmail.com', '10minutemail.com', 'tempmail.com', 'sharklasers.com']);
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net', 'protonmail.com', 'proton.me', 'ymail.com', 'mac.com']);

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length >= 3 && !['llc', 'inc', 'group', 'the', 'and'].includes(t));

// Stolen emails never match the fake name. Real people's addresses almost
// always contain part of their name or their team/company. A role address
// (info@, sales@) only vouches when its domain belongs to the company typed in.
function emailUnrelated(name: string, company: string, email: string): boolean {
  const [local = '', domain = ''] = email.toLowerCase().split('@');
  const localLetters = local.replace(/[^a-z]/g, '');
  const companyHit = tokens(company).some((t) => localLetters.includes(t) || domain.includes(t));
  if (ROLE_LOCAL.test(local.replace(/[._-]/g, ''))) return !companyHit;
  const nameHit = tokens(name).some((t) => localLetters.includes(t));
  return !nameHit && !companyHit;
}

async function domainHasNoMail(domain: string): Promise<boolean> {
  try {
    const mx = await Promise.race([dns.resolveMx(domain), new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
    if (mx === null) return false;
    return mx.length === 0;
  } catch (err) {
    const code = (err as { code?: string }).code;
    return code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL';
  }
}

// ---------- scam checks (people, not bots) ----------

const NEW_DOMAIN_DAYS = 120;

// Registry RDAP endpoints answer directly (rdap.org's redirector 403s server fetches).
function rdapUrl(domain: string): string {
  const tld = domain.split('.').pop() ?? '';
  if (tld === 'com' || tld === 'net') return `https://rdap.verisign.com/${tld}/v1/domain/${domain}`;
  if (tld === 'org') return `https://rdap.publicinterestregistry.org/rdap/domain/${domain}`;
  return `https://rdap.org/domain/${domain}`;
}

async function domainAgeDays(domain: string): Promise<number | null> {
  try {
    const res = await fetch(rdapUrl(encodeURIComponent(domain)), {
      headers: { Accept: 'application/rdap+json', 'User-Agent': 'townies-lead-check/1.0' },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { events?: Array<{ eventAction: string; eventDate: string }> };
    const reg = j.events?.find((e) => e.eventAction === 'registration')?.eventDate;
    if (!reg) return null;
    return (Date.now() - new Date(reg).getTime()) / 86_400_000;
  } catch {
    return null; // lookup down or slow: never punish the lead
  }
}

// DNS, not HTTP: big company sites block scripted requests, but every real
// website has an address record on the domain or its www.
async function domainHasNoWebsite(domain: string): Promise<boolean> {
  const has = async (host: string) => {
    try {
      const a = await Promise.race([dns.resolve4(host), new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
      return a === null ? true : a.length > 0;
    } catch {
      return false;
    }
  };
  const [bare, www] = await Promise.all([has(domain), has(`www.${domain}`)]);
  return !bare && !www;
}

const SERVICE_WORDS = /\bhats?\b|\bcaps?\b|embroider|snapback|trucker|beanie|logo|townies|good kicks/i;
const RFQ_PHRASES = [/commercial project/i, /design concept/i, /specification/i, /site photos/i, /dimensions/i, /review the project/i, /project details/i, /provide (an )?estimate/i, /bid (invitation|request)|invitation to bid/i, /request for (quote|proposal)|\brf[qp]\b/i, /attached (plans|drawings|documents)/i];

function genericRfq(message: string): boolean {
  if (!message || SERVICE_WORDS.test(message)) return false;
  return RFQ_PHRASES.filter((r) => r.test(message)).length >= 2;
}

// ---------- sales pitches (people selling TO the shop, not buying) ----------

const PITCH_PHRASES = [
  /virtual assistant|\bVAs?\b|MAVIS/,
  /\bSEO\b|search engines?|first page|top of (the )?search|rank(ing)?s? (higher|on google)|more traffic/i,
  /financing|funding|lending|line of credit|working capital|merchant cash|no personal guarantee/i,
  /guest (post|article)|contribute an? article|my article|publish(ing)? it on your (site|website)/i,
  /AI (agent|employee|system)|custom.built AI/i,
  /lead.generation|more (customers|leads|clients|sales)|generate more/i,
  /acquire businesses|considered selling|buyers actively/i,
  /reviews? provider|google reviews|trustpilot/i,
  /wikipedia/i,
  /reply (stop|yes)|respond with stop|opt.?out|unsubscribe/i,
  /tried emailing (you|but)|reaching out here instead|didn.t (seem to )?land/i,
  /mobile experience|website (design|redesign)|improve (your )?(site|website|store)|areas? (for|of) improvement|shopify (expert|developer|apps?)/i,
  /book (a|your) (call|demo)|cal\.com|calendly|15 minutes|quick (call|chat)/i,
  /targeted visitors|drive (traffic|visitors)|keyword options/i,
  /article (idea|on)|\barticle\b.{0,80}(your (site|website|audience|readers))/i,
  /dropshipping|print.on.demand (supplier|partner)|we manufacture|factory direct|our factory|MOQ\b/i,
];

/** Wording a buyer, customer or applicant uses. Hats/apparel by default. */
export const BUYER_INTENT = {
  // Good Kicks sells hacky sacks, so the sack words count too.
  hats: /custom hats?|\bhats?\b|\bcaps?\b|\bsacks?\b|hacky|footbag|our (team|club|school|league|shop|store|business|company|event|group|town|program|staff|crew|wedding|reunion|class|house|chapter|fraternity|frat|sorority)|\border(ed|ing|s)?\b|\bquote\b|how much|pric(e|es|ing)|bulk|wholesale|embroider|\blogo\b|\d+\s*(hats|caps|pieces|units)|my (town|order|hat|package|size)|shipping|delivery|return|exchange|refund|tracking|size|fit/i,
  rep: /\b(rep|ambassador)\b|my (town|school|followers|friends|team|account|page|community)|instagram|tiktok|followers|\bhats?\b|townies|good kicks|\bpost(s|ing)?\b|content|wear/i,
  market: /we (make|sell|bake|brew|create|design|print|roast|craft)|our (shop|store|products?|business|brand|bakery|cafe|café|studio|goods|stall|farm)|handmade|hand.made|local|market|small business|family.owned/i,
  review: /\bhats?\b|\bcaps?\b|fit|quality|love|great|comfortable|gift|order|ship|wear|color|colour|stitch/i,
};

export function salesPitch(message: string, buyerIntent: RegExp): boolean {
  if (!message) return false;
  const hits = PITCH_PHRASES.filter((r) => r.test(message)).length;
  return hits >= 2 || (hits >= 1 && !buyerIntent.test(message));
}

// ---------- the verdict ----------

export type FormInput = {
  name: string;
  email: string;
  /** Team / company / organisation / business name, when the form asks. */
  company?: string;
  /** Every free-text field joined (message, notes, about). */
  message?: string;
  /** True when the form carried real detail beyond name + email. */
  hasDetail: boolean;
  /** Signed form token from GET /api/form-token. */
  token: unknown;
  /** The off-screen trap field. Anything in it is a bot. */
  honey?: unknown;
  buyerIntent: RegExp;
};

export type Verdict = { spam: boolean; reasons: string[] };

export async function judgeForm(input: FormInput, opts: { skipToken?: boolean } = {}): Promise<Verdict> {
  const reasons: string[] = [];
  let score = 0;
  const flag = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (typeof input.honey === 'string' && input.honey.trim()) return { spam: true, reasons: ['honeypot'] };

  if (!opts.skipToken) {
    const tok = checkFormToken(input.token);
    if (tok === 'missing' || tok === 'bad' || tok === 'fast') return { spam: true, reasons: [`token:${tok}`] };
    if (tok === 'stale') flag(2, 'token:stale');
  }

  const name = (input.name ?? '').trim();
  const company = (input.company ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();
  const message = (input.message ?? '').trim();

  if (company && FAKER_COMPANY_MULTI.test(company)) flag(2, 'company:faker');
  else if (company && FAKER_COMPANY_SUFFIX.test(company)) flag(1, 'company:llc-inc-group');
  if (FAKER_NAME_PREFIX.test(name) || FAKER_NAME_SUFFIX.test(name)) flag(1, 'name:title');
  const unrelated = emailUnrelated(name, company, email);
  if (unrelated) flag(1, 'email:unrelated');
  if (!message && !input.hasDetail) flag(1, 'no-detail');

  const domain = email.split('@')[1] ?? '';
  if (DISPOSABLE.has(domain)) flag(2, 'email:disposable');
  else if (domain && (await domainHasNoMail(domain))) flag(2, 'email:no-mx');

  if (domain && !FREE_MAIL.has(domain) && !DISPOSABLE.has(domain)) {
    const [age, noSite] = await Promise.all([domainAgeDays(domain), domainHasNoWebsite(domain)]);
    if (age !== null && age < NEW_DOMAIN_DAYS) flag(2, `email:new-domain(${Math.round(age)}d)`);
    if (noSite) flag(1, 'email:no-website');
  }
  if (genericRfq(message)) flag(2, 'message:generic-rfq');
  // A pitch is spam on its own: vendors write from their own real addresses.
  if (salesPitch(message, input.buyerIntent)) return { spam: true, reasons: [...reasons, 'message:sales-pitch'] };

  // Content alone never flags a lead whose email fits the person: faker-looking
  // names only count when the address doesn't belong to them.
  const badAddress = unrelated || reasons.some((r) => r.startsWith('email:'));
  // When the address does match the person, domain trouble alone is not
  // enough: a real customer who typed "gmail.con" fails every domain check.
  // Something in the content (faker company, stale token, RFQ scam wording)
  // has to agree.
  const contentScore = score - reasons.filter((r) => r.startsWith('email:')).reduce((n, r) => n + (r.startsWith('email:no-website') || r === 'email:unrelated' ? 1 : 2), 0);
  return { spam: score >= 3 && badAddress && (unrelated || contentScore >= 1), reasons };
}
