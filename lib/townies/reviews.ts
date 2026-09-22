/**
 * Customer reviews and customer photography — THE CONTENT LIVES HERE.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  REVIEWS NOW COME FROM THE DATABASE, NOT FROM HERE.
 *  Customers write them at /review (or /review/<token>, the link in the
 *  post-delivery email); they land as `pending`; you approve them at
 *  /admin/reviews; approved ones appear on the homepage. `lib/reviews/server.ts`
 *  is the read path.
 *
 *  REVIEWS below is kept as a manual override for a review that arrived some
 *  other way — a text message, a DM — and is typed up with the customer's
 *  say-so. It is NOT a seeding hatch. Anything in it renders alongside the real
 *  ones with no way for a reader to tell them apart, which is exactly why the
 *  rule below applies to it just as hard.
 *
 *  UGC is still a plain list; there is no upload path for customer photos yet.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * THE ONE RULE: every entry must be something a real customer actually said or
 * shot. Not a paraphrase, not a composite, not an illustration of the kind of
 * thing people say, and not a friend's name on words somebody else wrote. A
 * fabricated review is a fabricated record, and the star rating beside it is a
 * claim about the store that a shopper can hold us to — it is also, since the
 * FTC's 2024 rule, the specific thing that carries a penalty per violation.
 *
 * A friend who actually bought the hat and writes their own words IS a
 * customer, and their review is as real as anyone's. That is the whole
 * distinction: who typed it, not who they are.
 *
 * An empty section costs a scroll; an invented one is a lie on the homepage.
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
 * Manual override — see the note at the top. Normally EMPTY, because reviews
 * come from the database now.
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
