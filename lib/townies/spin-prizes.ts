// The Townies rotary — prize table.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  THIS FILE IS THE ONLY PLACE THE OFFERS LIVE.                            │
// │                                                                          │
// │  The percentages below are PLACEHOLDERS. Discounting is the client's     │
// │  call, not ours — confirm every number here with Townies before this      │
// │  goes live, then change them in this one file. Nothing else needs        │
// │  touching: the wheel, the odds, the emailed code and the Shopify         │
// │  discount are all generated from this array.                             │
// └──────────────────────────────────────────────────────────────────────────┘
//
// How it works:
//   • One entry = one wedge on the wheel, in clockwise order from the top.
//   • `weight` is the relative chance of landing on THAT WEDGE. Duplicated
//     offers therefore compound naturally — three 10% wedges at 24 each means
//     10% off comes up ~57% of the time. Set a weight to 0 to keep a wedge on
//     the wheel for looks while making it unwinnable (don't — see the note on
//     honesty at the bottom).
//   • The draw happens on the SERVER (app/api/spin/route.ts). The browser is
//     told which wedge to stop on; it never chooses. Otherwise anyone with dev
//     tools spins a guaranteed 20%.
//
// Massachusetts framing: a rotary, and every wedge is an exit off it. The exit
// number IS the discount, which is the whole joke — keep that pairing intact if
// you change the percentages (18% off should sit on "EXIT 18").

export type PrizeKind = 'percentage' | 'free_shipping' | 'fixed_amount';

export type SpinWedge = {
  /** Stable id — stored on the claim row, so don't recycle one for a new offer. */
  id: string;
  /** Small line, outboard on the wedge. */
  exit: string;
  /** The offer itself, big. Keep it to ~8 characters or it crowds the wedge. */
  label: string;
  kind: PrizeKind;
  /** Whole percent off. Required for `percentage`, ignored otherwise. */
  percentOff?: number;
  /** Dollars off the order. Required for `fixed_amount`, ignored otherwise. */
  amountOff?: number;
  /** Relative draw weight within this array. */
  weight: number;
  /** Leading half of the minted code, e.g. ROTARY15-K4Q7NP. Letters/digits only. */
  codePrefix: string;
  /** One line of plain English for the success screen and the email. */
  terms: string;
  /** Wedge fill. Brand palette only: navy / forest / cream. */
  fill: 'navy' | 'forest' | 'cream';
};

/** Brand palette, mirrored from app/globals.css --color-town-*. */
export const WEDGE_COLORS = {
  navy: '#0D1B2A',
  forest: '#2F4F3A',
  cream: '#F2EFE8',
} as const;

/** Text colour that sits on each wedge fill. */
export const WEDGE_INK = {
  navy: '#F2EFE8',
  forest: '#F2EFE8',
  cream: '#0D1B2A',
} as const;

export const WEDGES: SpinWedge[] = [
  {
    id: 'pct10-a',
    exit: 'Exit 10',
    label: '10% OFF',
    kind: 'percentage',
    percentOff: 10,
    weight: 24,
    codePrefix: 'ROTARY10',
    terms: '10% off your order',
    fill: 'navy',
  },
  {
    id: 'ship-a',
    exit: 'No toll',
    label: 'FREE SHIP',
    kind: 'free_shipping',
    weight: 12,
    codePrefix: 'ROTARYSHIP',
    terms: 'Free shipping on your order',
    fill: 'forest',
  },
  {
    id: 'pct15-a',
    exit: 'Exit 15',
    label: '15% OFF',
    kind: 'percentage',
    percentOff: 15,
    weight: 14,
    codePrefix: 'ROTARY15',
    terms: '15% off your order',
    fill: 'navy',
  },
  {
    id: 'pct10-b',
    exit: 'Exit 10',
    label: '10% OFF',
    kind: 'percentage',
    percentOff: 10,
    weight: 24,
    codePrefix: 'ROTARY10',
    terms: '10% off your order',
    fill: 'forest',
  },
  // The rare one, and the only cream wedge — it reads as a lit signboard among
  // the dark wedges, which is the point. ~2% of spins.
  {
    id: 'pct20',
    exit: 'Exit 20',
    label: '20% OFF',
    kind: 'percentage',
    percentOff: 20,
    weight: 3,
    codePrefix: 'ROTARY20',
    terms: '20% off your order',
    fill: 'cream',
  },
  {
    id: 'ship-b',
    exit: 'No toll',
    label: 'FREE SHIP',
    kind: 'free_shipping',
    weight: 12,
    codePrefix: 'ROTARYSHIP',
    terms: 'Free shipping on your order',
    fill: 'forest',
  },
  {
    id: 'pct15-b',
    exit: 'Exit 15',
    label: '15% OFF',
    kind: 'percentage',
    percentOff: 15,
    weight: 14,
    codePrefix: 'ROTARY15',
    terms: '15% off your order',
    fill: 'navy',
  },
  {
    id: 'pct10-c',
    exit: 'Exit 10',
    label: '10% OFF',
    kind: 'percentage',
    percentOff: 10,
    weight: 24,
    codePrefix: 'ROTARY10',
    terms: '10% off your order',
    fill: 'forest',
  },
];

/** How long a minted code stays live. Short enough to create urgency. */
export const CODE_VALID_DAYS = 14;

/** How long the signed spin result stays claimable after the wheel stops. */
export const SPIN_TOKEN_TTL_SECONDS = 15 * 60;

const TOTAL_WEIGHT = WEDGES.reduce((sum, w) => sum + w.weight, 0);

/**
 * Draw a wedge index. SERVER ONLY — see the header note.
 *
 * `crypto.getRandomValues` rather than Math.random: this decides what money
 * comes off an order, and Math.random is neither uniform nor unpredictable
 * enough to be the thing standing between a visitor and 20% off.
 */
export function drawWedgeIndex(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  let roll = (buf[0] / 2 ** 32) * TOTAL_WEIGHT;

  for (let i = 0; i < WEDGES.length; i++) {
    roll -= WEDGES[i].weight;
    if (roll < 0) return i;
  }
  // Only reachable on a float edge case; the last positive-weight wedge is the
  // honest answer, not wedge 0.
  for (let i = WEDGES.length - 1; i >= 0; i--) {
    if (WEDGES[i].weight > 0) return i;
  }
  return 0;
}

/**
 * Look a prize up by the id stored on a claim row. Returns null for an id that
 * has since been removed from the table — hence the warning on `id` above about
 * never recycling one for a different offer.
 */
/**
 * The welcome offer from the v2 slide-in (2026-10): a fixed prize, not on the
 * wheel. It rides the same signed-token + claim path as a spin, so it gets the
 * same one-code-per-email guarantee and the same Shopify-first minting. It
 * lives at a token index the wheel can never draw.
 */
export const WELCOME_INDEX = 100;
export const WELCOME: SpinWedge = {
  id: 'welcome10',
  exit: 'Welcome',
  label: '10% OFF',
  kind: 'percentage',
  percentOff: 10,
  weight: 0,
  codePrefix: 'WELCOME10',
  terms: '10% off your first order',
  fill: 'navy',
};

/**
 * Mass trivia prizes (2026-10-07, Lucas): the pop-up is four easy questions
 * and the score picks the prize. Everyone wins at least $5 off. Token indexes
 * QUIZ_BASE + tier, so the wheel can never draw them.
 */
export const QUIZ_BASE = 200;
export const QUIZ_PRIZES: SpinWedge[] = [
  { id: 'quiz5', exit: 'Mass trivia', label: '$5 OFF', kind: 'fixed_amount', amountOff: 5, weight: 0, codePrefix: 'MASS5', terms: '$5 off your order', fill: 'navy' },
  { id: 'quiz7', exit: 'Mass trivia', label: '$7 OFF', kind: 'fixed_amount', amountOff: 7, weight: 0, codePrefix: 'MASS7', terms: '$7 off your order', fill: 'navy' },
  { id: 'quizship', exit: 'Mass trivia', label: 'FREE SHIP', kind: 'free_shipping', weight: 0, codePrefix: 'MASSSHIP', terms: 'Free shipping on your order', fill: 'forest' },
  { id: 'quiz10', exit: 'Mass trivia', label: '$10 OFF', kind: 'fixed_amount', amountOff: 10, weight: 0, codePrefix: 'MASS10', terms: '$10 off your order', fill: 'navy' },
];
/**
 * Score out of 2 → prize tier (Lucas, 10-07: two questions): 0 right $5,
 * 1 right $7, 2 right $10. The free-shipping tier is kept for codes already
 * issued but no longer awarded.
 */
export function quizTier(score: number): number {
  return score >= 2 ? 3 : score === 1 ? 1 : 0;
}

export function wedgeById(id: string): SpinWedge | null {
  if (id === WELCOME.id) return WELCOME;
  const quiz = QUIZ_PRIZES.find((w) => w.id === id);
  if (quiz) return quiz;
  return WEDGES.find((w) => w.id === id) ?? null;
}

export function wedgeAt(index: unknown): SpinWedge | null {
  if (index === WELCOME_INDEX) return WELCOME;
  if (typeof index === 'number' && index >= QUIZ_BASE && index < QUIZ_BASE + QUIZ_PRIZES.length) {
    return QUIZ_PRIZES[index - QUIZ_BASE];
  }
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < WEDGES.length
    ? WEDGES[index]
    : null;
}

// A note on honesty, because it's cheap to get wrong here: the popup says
// "every exit wins something", and that stays true only while every wedge has a
// weight above 0. If you ever want a losing wedge, change the copy in
// components/townies/rotary-spin.tsx to match — a wheel that can't land where
// it says it can is the kind of thing that ends up on a consumer-protection
// blog post.
