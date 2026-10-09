// The money rules for every sale through our own checkout. Pure functions, no
// I/O, so they're tested directly (lib/shop/money.test.ts).
//
// Per hat:
//   we keep        = wholesale ($22 everyday, $24 lifestyle)
//   business gets  = price − wholesale
//   Dylan gets     = $5 of OUR wholesale, only when the business came to us
//                    through RoyalBacks
// Shipping and tax sit on top of the hat price and stay with us; Stripe's fee
// comes out of our cut because we're the merchant of record.

export type WholesaleType = 'everyday' | 'lifestyle';

export const WHOLESALE_CENTS: Record<WholesaleType, number> = {
  everyday: 2200,
  lifestyle: 2400,
};

export const WHOLESALE_LABEL: Record<WholesaleType, string> = {
  everyday: 'Everyday',
  lifestyle: 'Lifestyle',
};

export const ROYALBACKS_FEE_CENTS = 500;

/** A business must earn at least this per hat. */
export const MIN_SPREAD_CENTS = 100;

/** Payouts wait this long after the hat ships or is picked up. */
export const PAYOUT_HOLD_DAYS = 14;

export function minPriceCents(wholesaleCents: number): number {
  return wholesaleCents + MIN_SPREAD_CENTS;
}

export type LineSplit = {
  sellerPayoutCents: number;
  royalbacksFeeCents: number;
  ourCutCents: number;
};

/**
 * Split one order line (qty hats of one design). The house seller (Townies
 * itself) keeps everything: no payout, no RoyalBacks fee.
 */
export function splitLine({
  unitPriceCents,
  wholesaleCents,
  qty,
  house = false,
  royalbacksSourced = false,
}: {
  unitPriceCents: number;
  wholesaleCents: number;
  qty: number;
  house?: boolean;
  royalbacksSourced?: boolean;
}): LineSplit {
  if (!Number.isInteger(qty) || qty < 1) throw new Error('qty must be a positive integer');
  const gross = unitPriceCents * qty;
  if (house) return { sellerPayoutCents: 0, royalbacksFeeCents: 0, ourCutCents: gross };
  if (unitPriceCents < minPriceCents(wholesaleCents)) {
    throw new Error('price is below wholesale + minimum spread');
  }
  const sellerPayoutCents = (unitPriceCents - wholesaleCents) * qty;
  const royalbacksFeeCents = royalbacksSourced ? Math.min(ROYALBACKS_FEE_CENTS, wholesaleCents) * qty : 0;
  return {
    sellerPayoutCents,
    royalbacksFeeCents,
    ourCutCents: gross - sellerPayoutCents - royalbacksFeeCents,
  };
}

/**
 * Shipping by hat count, matching the Townies Shopify profile
 * ("Hats — Standard Shipping": ≤0.5 lb $5.95, ≤1 lb $8.95, over $12.95).
 * Pickup is free.
 */
export function shippingCents(hatCount: number, delivery: 'ship' | 'pickup'): number {
  if (delivery === 'pickup' || hatCount <= 0) return 0;
  if (hatCount === 1) return 595;
  if (hatCount === 2) return 895;
  return 1295;
}

export function releaseAt(handedOver: Date): Date {
  return new Date(handedOver.getTime() + PAYOUT_HOLD_DAYS * 24 * 60 * 60 * 1000);
}

export function dollars(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
