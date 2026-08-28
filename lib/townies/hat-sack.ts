// The Townies × Good Kicks "Hat & Sack" promotion.
//
// One $35 line: any town snapback the customer picks, plus a Good Kicks foot bag
// WE pick. The random half is a FULFILMENT fact, not a storefront one — nothing
// here draws a bag or reserves one. The site's only job is to name the five that
// are in the running so "random" isn't a blank cheque.
//
// The bundle is a real Shopify product (`hat-and-sack`) carrying TWO variants,
// both $35: "Ships now" and "Pre-order". The second exists purely so the line can
// sit in the Pre-order delivery profile — a bundle built around a pre-order town
// has to quote the pre-order window AT CHECKOUT, and a variant is the only thing
// a Shopify delivery profile can hold. Site copy cannot override the checkout
// promise, and getting that wrong is the Good Kicks shipping disaster again.

import type { CollectionProduct } from '@/lib/shopify/collections';
import { isPreorder } from '@/lib/townies/preorder';

/**
 * Master switch for the whole promotion. OFF as of 2026-08-28 — the offer is
 * built and proven end to end, but fulfilment isn't solved yet, so it must not
 * be purchasable.
 *
 * Off means: no homepage band, no /shop link, no PDP upsell, and /hat-and-sack
 * 404s. The Shopify product is separately set to DRAFT and unpublished from
 * every channel, so the variants can't be bought even by posting a variant id
 * straight at /api/checkout. BOTH have to be reversed to relaunch — flip this
 * to true and redeploy, then set the product ACTIVE and publish it to the
 * "Townies Shop" channel only.
 */
export const HAT_SACK_LIVE = false;

export const HAT_SACK_HANDLE = 'hat-and-sack';
export const HAT_SACK_PATH = '/hat-and-sack';

/**
 * LAST-RESORT price, used only when the Shopify read fails.
 *
 * The live price comes from the Shopify variant — see getHatSackOffer(). It has
 * to, because the bundle price is going to move (hats $30 → $35 at the end of
 * September 2026 takes the bundle $35 → $40). A hardcoded price here plus a
 * price on the variant is two sources of truth: change the variant alone and the
 * site would show $35, put $35 in the cart, and Shopify would charge $40 at
 * checkout. Repricing must be a Shopify-admin action, never a deploy.
 */
export const HAT_SACK_PRICE_FALLBACK_CENTS = 3500;

/** Shopify variant titles on the bundle product. Matched by title, not by id, so
 *  the ids can change (a re-created variant, a restored product) without a deploy. */
export const HAT_SACK_VARIANT_TITLE = {
  shipsNow: 'Ships now',
  preorder: 'Pre-order',
} as const;

/**
 * The draw pool: the $9.99 Good Kicks v1 foot bags that are actually in stock.
 *
 * Deliberately a hardcoded list rather than a live Shopify read. What ships is
 * whatever's in the bin when the order is packed, so this is a promise about the
 * promotion, not a product feed — and a bag going out of stock for a week must
 * not silently rewrite the offer on the page. The Pro bags ($12.99) and the
 * Massachusetts bag (unlisted) are out of the pool on purpose.
 *
 * Images are background-removed cutouts of the store's own product shots; the
 * originals are photographed on a wood surface and cannot sit on a cream ground.
 */
export const SACK_POOL = [
  { name: 'Montana', handle: 'the-good-kick-montana', image: '/brand/goodkicks/bag-montana.webp' },
  { name: 'New Mexico', handle: 'the-good-kick-new-mexico', image: '/brand/goodkicks/bag-new-mexico.webp' },
  { name: 'Tennessee', handle: 'the-good-kick-tennessee', image: '/brand/goodkicks/bag-tennessee.webp' },
  { name: 'New York', handle: 'the-good-kick-new-york', image: '/brand/goodkicks/bag-new-york.webp' },
  { name: 'Maine', handle: 'the-good-kick-maine', image: '/brand/goodkicks/bag-maine.webp' },
] as const;

/** Last-resort bag value; the live figure is read from Shopify alongside the price. */
export const SACK_VALUE_FALLBACK_CENTS = 999;

export function priceCents(p: CollectionProduct): number | null {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? Math.round(parseFloat(amount) * 100) : null;
}

/**
 * What the customer saves against buying the two separately, or null when
 * there's nothing to claim.
 *
 * The $24.99 zip hats plus a $9.99 bag come to $34.98, so the bundle is a
 * penny MORE than the parts. Returning null there — rather than a $0 or a
 * negative — is what stops the UI printing a saving that doesn't exist.
 */
export function hatSackSavingCents(
  hatPriceCents: number | null,
  bundleCents: number,
  sackCents: number,
): number | null {
  if (hatPriceCents === null) return null;
  const saving = hatPriceCents + sackCents - bundleCents;
  return saving > 0 ? saving : null;
}

/**
 * Shopify tag that takes a hat OUT of the bundle.
 *
 * Opt-OUT, not opt-in, because the end state is every town included: a hat
 * coming off pre-order, or a new town launching, joins the bundle with no tag
 * and no deploy. Only the exceptions need touching.
 *
 * Excluded as of 2026-08-28: the two $24.99 zip hats (Milton '02186', Hingham
 * '02043'), where $24.99 + a $9.99 bag is $34.98 and the "bundle" would cost a
 * penny more than the parts; and Sandwich 'Classic'. Remove the tag in Shopify
 * admin to put a town back in.
 */
export const BUNDLE_EXCLUDE_TAG = 'no-bundle';

export function isBundleEligible(tags: string[] | undefined | null): boolean {
  return !(Array.isArray(tags) && tags.some((t) => t.toLowerCase() === BUNDLE_EXCLUDE_TAG));
}

/** Every eligible hat, pre-order towns included, in-stock towns first. */
export function eligibleHats(products: CollectionProduct[]): CollectionProduct[] {
  return products
    .filter((p) => p.variants.edges[0]?.node.availableForSale ?? false)
    .filter((p) => isBundleEligible(p.tags))
    .sort((a, b) => {
      // In-stock towns lead: they're the ones that can ship this week, and a
      // pre-order card at the top of the grid buries that.
      const pre = Number(isPreorder(a.tags)) - Number(isPreorder(b.tags));
      return pre !== 0 ? pre : a.title.localeCompare(b.title);
    });
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
