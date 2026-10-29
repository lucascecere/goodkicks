// The first-order offer from the pop-up: $5 off + free shipping. Hands back a
// signed token for the fixed prize, claimed through /api/spin/claim like the
// wheel and the trivia (Shopify-first minting, one code per email, and the
// claim refuses emails that have already ordered).

import type { NextRequest } from 'next/server';
import { FIRST_ORDER_INDEX } from '@/lib/townies/spin-prizes';
import { createSpinToken, isSpinSigningConfigured } from '@/lib/townies/spin-token';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isSpinSigningConfigured()) return Response.json({ error: 'Not set up yet.' }, { status: 503 });
  if (!rateLimit(`welcome:${callerIp(req.headers)}`, 10, 60_000)) {
    return Response.json({ error: 'Slow down a second.' }, { status: 429 });
  }
  return Response.json(
    { token: await createSpinToken(FIRST_ORDER_INDEX) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
