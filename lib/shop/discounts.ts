// Discount codes for our own checkout. Pure rules here (tested in
// discounts.test.mts); the database lookup is in discounts-db.ts.
//
// The one rule that matters most: a code only ever discounts TOWNIES' OWN
// hats. A local business's hat is never discounted by our promo, so a code
// can't quietly shrink what we owe that business.

export type DiscountKind = 'percent' | 'fixed' | 'free_shipping';

export type DiscountScope = 'all' | 'hats' | 'foot_bags';

export type Discount = {
  id: string;
  code: string;
  kind: DiscountKind;
  scope: DiscountScope;
  /** percent: 0–100; fixed: cents; free_shipping: ignored. */
  value: number;
  min_subtotal_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
};

export type PricedLine = {
  key: string;
  house: boolean;
  /** Product kind; decides whether a scoped code covers the line. */
  kind?: 'hat' | 'foot_bag' | 'bundle' | 'internal';
  unitPriceCents: number;
  qty: number;
};

/** Lines this code can discount: our own, and inside the code's scope. */
export function eligibleLines(d: Pick<Discount, 'scope'>, lines: PricedLine[]): PricedLine[] {
  return lines.filter((l) => {
    if (!l.house) return false;
    if (d.scope === 'hats') return l.kind === 'hat' || l.kind === 'bundle';
    if (d.scope === 'foot_bags') return l.kind === 'foot_bag' || l.kind === 'bundle';
    return true;
  });
}

export type DiscountResult = {
  /** Off the hats (not shipping). */
  itemsCents: number;
  /** Per line, by `key`, summing to itemsCents. */
  perLine: Record<string, number>;
  freeShipping: boolean;
};

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

/** Why a code can't be used right now, or null if it can. */
export function discountProblem(d: Discount, lines: PricedLine[], now = new Date()): string | null {
  if (!d.active) return 'That code has ended.';
  if (d.starts_at && Date.parse(d.starts_at) > now.getTime()) return "That code isn't active yet.";
  if (d.ends_at && Date.parse(d.ends_at) <= now.getTime()) return 'That code has ended.';
  if (d.usage_limit !== null && d.used_count >= d.usage_limit) return 'That code has already been used.';
  const eligible = eligibleLines(d, lines).reduce((n, l) => n + l.unitPriceCents * l.qty, 0);
  if (eligible === 0) {
    if (lines.every((l) => !l.house)) return 'Codes work on Townies hats, not on hats from local shops.';
    return d.scope === 'foot_bags' ? 'That code is for Good Kicks foot bags.' : "That code doesn't cover what's in your bag.";
  }
  if (eligible < d.min_subtotal_cents) {
    return `That code needs $${(d.min_subtotal_cents / 100).toFixed(2)} of Townies hats in your bag.`;
  }
  return null;
}

export function applyDiscount(d: Discount, lines: PricedLine[]): DiscountResult {
  const eligible = eligibleLines(d, lines);
  const base = eligible.reduce((n, l) => n + l.unitPriceCents * l.qty, 0);
  if (d.kind === 'free_shipping') return { itemsCents: 0, perLine: {}, freeShipping: true };

  const total =
    d.kind === 'percent' ? Math.floor((base * Math.min(100, d.value)) / 100) : Math.min(d.value, base);

  // Spread it over the eligible lines in proportion to their value; the last
  // line takes the rounding remainder so the parts always add up exactly.
  const perLine: Record<string, number> = {};
  let left = total;
  eligible.forEach((l, i) => {
    const share = i === eligible.length - 1 ? left : Math.floor((total * l.unitPriceCents * l.qty) / base);
    perLine[l.key] = share;
    left -= share;
  });
  return { itemsCents: total, perLine, freeShipping: false };
}
