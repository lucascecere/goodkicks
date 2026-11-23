// The "two-town deal": any 2+ hats, $4.99 off each (so $29.99 hats are $25).
//
// The discount itself lives in Shopify as an AUTOMATIC discount
// ("Two-town deal: 2+ hats, $25 each",
// gid://shopify/DiscountAutomaticNode/1241515557019). It takes $4.99 off every
// product with productType "Hats" (smart collection `all-hats`) once the cart
// holds 2 or more of them. The Hat & Sack bundle (productType "Bundle") and
// foot bags don't count and don't get it. It does NOT combine with other
// product/order discounts (HELLO5, BACK5, spin codes) but does combine with
// shipping discounts (HELLOSHIP, the $75 free-shipping automatic).
//
// Everything on the site that mentions the deal reads THIS file: the
// announcement bar, the hat page line, the cart drawer's saving line and
// nudge, and the bag's choice of which first-order code to send. Ending the
// deal = set `enabled: false` here AND deactivate the Shopify discount. Both,
// or the site will promise a price checkout won't give (or hide one it will).

import { FIRST_ORDER } from '@/lib/townies/spin-prizes';

export const TWO_TOWN_DEAL = {
  enabled: true,
  /** Off each hat, in cents, once the bag has `minHats` hats. */
  perHatOffCents: 499,
  minHats: 2,
  /** The Shopify productType that counts as a hat (the discount's own rule). */
  hatProductType: 'Hats',
} as const;

/** True when `count` hat units earn the deal. */
export function dealApplies(hatUnits: number): boolean {
  return TWO_TOWN_DEAL.enabled && hatUnits >= TWO_TOWN_DEAL.minHats;
}

/** The deal's saving for this many hat units, in cents (0 below the minimum). */
export function dealSavingCents(hatUnits: number): number {
  return dealApplies(hatUnits) ? hatUnits * TWO_TOWN_DEAL.perHatOffCents : 0;
}

/** A hat's price inside the deal, in cents (e.g. 2999 → 2500, 3199 → 2700). */
export function dealHatPriceCents(priceCents: number): number {
  return Math.max(0, priceCents - TWO_TOWN_DEAL.perHatOffCents);
}

/**
 * The first-order codes the bag should send to checkout, given the hats in it.
 *
 * The pop-up's pair is HELLO5-xxxx ($5 off the order, combines with shipping
 * only) + HELLOSHIP-xxxx (free shipping, combines with everything). HELLO5 and
 * the two-town deal can't both apply. Shopify would pick the better one by
 * itself, but sending a code it then refuses shows the shopper a "couldn't be
 * used" error at checkout and burns nothing useful. So once the deal is worth
 * more than the dollar code (2 hats = $9.98 vs $5), the bag leaves the dollar
 * code out (it stays saved and usable on a later order) and keeps the
 * free-shipping code, which stacks with the deal.
 *
 * Only call with a CONFIRMED hat count (Shopify productType). On a guess, send
 * every code and let Shopify choose.
 */
export function checkoutCodes(codes: string[], hatUnits: number): string[] {
  const saving = dealSavingCents(hatUnits);
  if (!saving) return codes;
  const dollarPrefix = `${FIRST_ORDER.codePrefix.toUpperCase()}-`;
  const dollarCents = Math.round((FIRST_ORDER.amountOff ?? 0) * 100);
  if (saving <= dollarCents) return codes;
  return codes.filter((c) => !c.toUpperCase().startsWith(dollarPrefix));
}

export function formatDealUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
