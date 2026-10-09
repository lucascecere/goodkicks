import 'server-only';
import type { createSupabaseServiceClient } from '@/lib/supabase/client';

// Best-effort per-IP throttle for the spin endpoints.
//
// HONEST ABOUT WHAT THIS IS: an in-memory counter inside a serverless function.
// It resets on cold start and each concurrent instance keeps its own, so it
// slows a casual script down and nothing more. The real guarantees are in the
// database — spin_claims has UNIQUE indexes on the email, on the spin nonce and
// on the code — and in Shopify, where every minted code has a usage limit of 1.
// Do not add a rule here and then reason as though it were enforced.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Trim expired buckets so a long-lived instance doesn't grow forever. */
function sweep(now: number) {
  if (buckets.size < 512) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}

/**
 * Caller IP, as far as it can be known behind Vercel's proxy.
 * `x-forwarded-for` is client-controlled in general, but Vercel overwrites it,
 * so the leftmost entry is trustworthy in this deployment. Falls back to a
 * single shared bucket rather than to "no limit".
 */
export function callerIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

/** SHA-256 of the IP, for storage. We want "was this one person" without keeping addresses. */
export async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`townies-spin:${ip}`));
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** New codes one IP can mint per rolling day. Repeat claims by email don't count. */
export const CLAIMS_PER_IP_PER_DAY = 3;

/**
 * The DURABLE limit, unlike rateLimit() above: counts this IP's rows in
 * spin_claims over the last 24h, so it holds across cold starts and instances.
 * Stops one person farming codes with burner addresses. Fails OPEN on a
 * database error: a real visitor losing their prize to a blip is the worse
 * outcome, and every code is still single-use in Shopify.
 */
export async function underDailyClaimLimit(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  ipHash: string,
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - 864e5).toISOString();
    const { count, error } = await supabase
      .from('spin_claims')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if (error) throw error;
    return (count ?? 0) < CLAIMS_PER_IP_PER_DAY;
  } catch (err) {
    console.error('[spin-ratelimit] daily claim count failed:', err);
    return true;
  }
}
