/**
 * Customer reviews and customer photography — THE CONTENT LIVES HERE.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  HOW TO PUT REVIEWS ON THE HOMEPAGE
 *  Paste real ones into REVIEWS below and they appear. Leave it empty and the
 *  whole section does not render — no placeholder, no "coming soon", no gap.
 *  Same for PHOTOS.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Why a file and not a reviews app: the store has no review app installed and
 * 119 orders is not enough to justify one yet. When it is, this module is the
 * single thing that changes — swap these constants for a fetch, keep the types,
 * and both sections carry on working.
 *
 * THE ONE RULE: every entry must be something a real customer actually said or
 * shot. Not a paraphrase, not a composite, not an illustration of the kind of
 * thing people say. A fabricated review is a fabricated record, and the star
 * rating that sits beside it is a claim about the store that a customer can
 * hold us to. An empty section costs a scroll; an invented one is a lie on the
 * homepage.
 */

export type Review = {
  /** 1–5, as the customer left it. Don't round a 4 up. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Their words, verbatim. Trim for length, never rewrite for tone. */
  quote: string;
  /** How they're credited — "Dan M." is fine, a full name needs permission. */
  name: string;
  /** Their town, when they gave it: "Milton, MA". Optional. */
  town?: string;
  /** Which hat, when it's known: "Milton Lifestyle Hat". Optional. */
  product?: string;
  /** True only when the order behind it has been matched in Shopify. */
  verified?: boolean;
};

export type UgcPost = {
  /** A photo we have the right to use — their DM permission, or our own repost. */
  src: string;
  alt: string;
  /** Optional caption or quote to sit over the photo. */
  quote?: string;
  /** Credit: "@handle" or a first name. */
  credit?: string;
  /** Links out to the post, when there is one. */
  href?: string;
};

/**
 * Real reviews go here.
 *
 * @example
 * export const REVIEWS: Review[] = [
 *   {
 *     rating: 5,
 *     quote: 'Wore it to the Thanksgiving game and three people asked where I got it.',
 *     name: 'Dan M.',
 *     town: 'Braintree, MA',
 *     product: 'Braintree Lifestyle Hat',
 *     verified: true,
 *   },
 * ];
 */
export const REVIEWS: Review[] = [];

/**
 * Real customer photography goes here. Files live in `public/brand/ugc/`.
 *
 * There is currently NO worn-hat photography of any kind on this site — every
 * shot in `public/brand` is product-on-a-sweep or a hat on a street. This
 * section is the slot for the first one that arrives.
 */
export const UGC: UgcPost[] = [];

/** Average of the real reviews, or null when there aren't enough to mean anything. */
export function averageRating(reviews: Review[] = REVIEWS): number | null {
  // Below five reviews an average is noise — one 3-star swings it half a point.
  if (reviews.length < 5) return null;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
