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

/** The promise in the Townies announcement bar: free shipping over $75. */
export const FREE_SHIPPING_OVER_CENTS = 7500;

/**
 * Shipping by hat count, matching the Townies Shopify profile
 * ("Hats — Standard Shipping": ≤0.5 lb $5.95, ≤1 lb $8.95, over $12.95).
 * Pickup is free, and so is any order whose hats come to $75 or more.
 */
export function shippingCents(hatCount: number, delivery: 'ship' | 'pickup', subtotalCents = 0): number {
  if (delivery === 'pickup' || hatCount <= 0) return 0;
  if (subtotalCents >= FREE_SHIPPING_OVER_CENTS) return 0;
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

/**
 * Shipping for the Townies + Good Kicks store, mirroring the Shopify profiles
 * it replaces:
 * - town hats ("Hats: Standard Shipping"): 1 hat $5.95, 2 $8.95, 3+ $12.95
 * - pre-order hats ("Pre-order" profile): $5.00 flat when any are in the order
 * - Good Kicks foot bags: always free
 * - Hat & Sack: shipping included
 * - the whole order ships free once the merchandise reaches $75
 * (Shopify adds the rates of each profile in a mixed cart; so does this.)
 */
export function storeShippingCents({
  standardHats,
  preorderHats,
  merchandiseCents,
}: {
  standardHats: number;
  preorderHats: number;
  merchandiseCents: number;
}): number {
  if (merchandiseCents >= FREE_SHIPPING_OVER_CENTS) return 0;
  const standard = standardHats <= 0 ? 0 : standardHats === 1 ? 595 : standardHats === 2 ? 895 : 1295;
  const preorder = preorderHats > 0 ? 500 : 0;
  return standard + preorder;
}
