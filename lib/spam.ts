// Form spam scoring for /api/contact (town requests, support, wholesale).
//
// The bot hitting Townies since 10-29 types random letters into every field
// ("Vhtepx Cgpol", town "Tfaov", note "HWNpucLOKdTNKLevBtwaBG") and uses real
// people's harvested emails. Same family as the TL Elite bot in Sept, so the
// gibberish test is the one from ywf-platform packages/crm/src/spam.ts.
//
// Additive score, threshold 4, so one weak signal never sinks a real request.

const SPAM_THRESHOLD = 4;
/** A submit sooner than this after the page loaded is not a person typing. */
const FAST_SUBMIT_MS = 3000;

// A run of 12+ letters whose case flips mid-word at least twice, AND reads as
// noise: starved of vowels, an impossible consonant run, or dense random caps.
// Real names, towns and camelCase handles don't pass all of that.
function isGibberish(token: string): boolean {
  const caseFlips = (token.match(/[a-z][A-Z]/g) ?? []).length;
  if (caseFlips < 2) return false;
  const vowels = (token.match(/[aeiou]/gi) ?? []).length;
  const longestConsonantRun = Math.max(...token.split(/[aeiou]/i).map((s) => s.length));
  const interiorCaps = (token.slice(1).match(/[A-Z]/g) ?? []).length;
  return (
    vowels / token.length < 0.25 ||
    longestConsonantRun >= 6 ||
    interiorCaps / (token.length - 1) >= 0.4 ||
    (interiorCaps >= 4 && caseFlips >= 3)
  );
}

function gibberishTokens(text: string): string[] {
  return (text.match(/[A-Za-z]{12,}/g) ?? []).filter(isGibberish);
}

export interface SpamInput {
  /** Every free-text field the person typed (name, town, message, …). */
  fields: string[];
  email?: string;
  /** ms from page load to submit, from the browser; undefined = not sent (no JS ran). */
  submitAfterMs?: number;
}

export function scoreSpam({ fields, email, submitAfterMs }: SpamInput): { isSpam: boolean; score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const junk = fields.flatMap((f) => gibberishTokens(f ?? ''));
  if (junk.length) {
    score += 4;
    reasons.push(`gibberish: ${junk.slice(0, 2).join(', ')}`);
  }

  if (submitAfterMs === undefined || !Number.isFinite(submitAfterMs)) {
    score += 3;
    reasons.push('posted without the page');
  } else if (submitAfterMs < FAST_SUBMIT_MS) {
    score += 3;
    reasons.push(`submitted ${Math.round(submitAfterMs)}ms after load`);
  }

  // Harvested Gmail addresses arrive dot-stuffed ("sh.a.nn.onc.3.78@gmail.com").
  // Gmail ignores the dots; people don't type four of them.
  const [local = '', domain = ''] = (email ?? '').toLowerCase().split('@');
  if (/^(gmail|googlemail)\.com$/.test(domain) && (local.match(/\./g) ?? []).length >= 4) {
    score += 2;
    reasons.push('dot-stuffed gmail');
  }

  return { isSpam: score >= SPAM_THRESHOLD, score, reasons };
}
