import 'server-only';
import { randomBytes } from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import type { RealBrand } from '@/lib/admin/brand';

/**
 * Reviews, server side.
 *
 * Every row in `reviews` exists because a customer typed it. Nothing in this
 * module writes a review on anyone's behalf, and there is deliberately no
 * "seed" or "import" path — see the rule at the top of lib/townies/reviews.ts.
 *
 * `verified` is not a display flag. It is true only when the review arrived
 * through a tokenised link generated from a FULFILLED Shopify order, so the
 * "Verified order" badge on the site is a fact about the order, not decoration.
 */

export type ReviewRow = {
  id: string;
  created_at: string;
  brand: string;
  rating: number;
  quote: string;
  name: string;
  town: string | null;
  product_title: string | null;
  product_handle: string | null;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  source: 'form' | 'request';
  email?: string | null;
  shopify_order_id?: string | null;
};

/** The public shape — no email, no order id. Never widen this. */
export type PublicReview = {
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
  name: string;
  town?: string;
  product?: string;
  verified?: boolean;
};

function toPublic(r: ReviewRow): PublicReview {
  return {
    rating: Math.min(5, Math.max(1, Math.round(r.rating))) as PublicReview['rating'],
    quote: r.quote,
    name: r.name,
    town: r.town ?? undefined,
    product: r.product_title ?? undefined,
    verified: r.verified || undefined,
  };
}

/**
 * Approved reviews for a brand, newest first.
 *
 * Degrades to [] on any failure — a database hiccup must not take the homepage
 * down, and an empty review section renders as nothing at all.
 */
export async function getApprovedReviews(
  brand: RealBrand = 'townies',
  limit = 12,
): Promise<PublicReview[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  try {
    const { data, error } = await createSupabaseServiceClient()
      .from('reviews')
      .select('*')
      .eq('brand', brand)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('[reviews] read failed:', error.message);
      return [];
    }
    return (data as ReviewRow[]).map(toPublic);
  } catch (err) {
    console.error('[reviews] threw:', err);
    return [];
  }
}

export type ReviewSubmission = {
  rating: number;
  quote: string;
  name: string;
  town?: string;
  email?: string;
  brand?: RealBrand;
  /** Present when the submission came from a tokenised request link. */
  token?: string;
};

export type SubmitResult =
  | { ok: true; verified: boolean }
  | { ok: false; error: string };

/**
 * Record a review a customer just wrote.
 *
 * Lands as `pending` ALWAYS — including from a verified order link. A verified
 * buyer can still put an address or somebody's full name in the box, and the
 * homepage is not the place to find that out.
 */
export async function submitReview(input: ReviewSubmission): Promise<SubmitResult> {
  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Pick a rating from 1 to 5.' };
  }
  const quote = input.quote?.trim() ?? '';
  const name = input.name?.trim() ?? '';
  if (quote.length < 10) return { ok: false, error: 'Tell us a little more than that.' };
  if (quote.length > 1200) return { ok: false, error: 'That is a bit long — trim it down.' };
  if (!name) return { ok: false, error: 'Add a name so we know who to credit.' };
  if (name.length > 80) return { ok: false, error: 'That name is too long.' };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[reviews] submit attempted with no database credentials.');
    return { ok: false, error: 'Reviews are not available right now. Try again later.' };
  }

  const db = createSupabaseServiceClient();

  // A token is the only way to be verified, and it must be unspent.
  let request: {
    id: string;
    email: string;
    brand: string;
    product_title: string | null;
    product_handle: string | null;
    shopify_order_id: string;
    review_id: string | null;
  } | null = null;

  if (input.token) {
    const { data } = await db
      .from('review_requests')
      .select('id, email, brand, product_title, product_handle, shopify_order_id, review_id')
      .eq('token', input.token)
      .maybeSingle();
    request = data ?? null;
    if (request?.review_id) {
      return { ok: false, error: 'This link has already been used — thank you though.' };
    }
  }

  const brand = (request?.brand as RealBrand) ?? input.brand ?? 'townies';

  const { data: inserted, error } = await db
    .from('reviews')
    .insert({
      brand,
      rating,
      quote,
      name,
      town: input.town?.trim() || null,
      email: request?.email ?? input.email?.trim() ?? null,
      product_title: request?.product_title ?? null,
      product_handle: request?.product_handle ?? null,
      shopify_order_id: request?.shopify_order_id ?? null,
      verified: Boolean(request),
      source: request ? 'request' : 'form',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[reviews] insert failed:', error?.message);
    return { ok: false, error: 'Something went wrong saving that. Try again in a minute.' };
  }

  // Spend the token so the link cannot be reused.
  if (request) {
    await db.from('review_requests').update({ review_id: inserted.id }).eq('id', request.id);
  }

  return { ok: true, verified: Boolean(request) };
}

/**
 * What the tokenised form shows above the box, so the ask is specific.
 *
 * Returns null on ANY failure — unknown token, spent token, database down, no
 * credentials. The page turns null into a 404; letting this throw turned an
 * unreachable database into a 500 on a link we emailed to a customer.
 */
export async function lookupRequest(token: string) {
  if (!token) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const { data, error } = await createSupabaseServiceClient()
      .from('review_requests')
      .select('name, brand, product_title, review_id')
      .eq('token', token)
      .maybeSingle();
    if (error) {
      console.error('[reviews] request lookup failed:', error.message);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error('[reviews] request lookup threw:', err);
    return null;
  }
}

/** 32 bytes of url-safe randomness — this token is the whole auth for the form. */
export function newToken(): string {
  return randomBytes(24).toString('base64url');
}
