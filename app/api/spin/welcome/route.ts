// The v2 slide-in's welcome offer: a signed token for the fixed WELCOME prize,
// claimed through ../claim exactly like a spin (Shopify-first minting, one code
// per email). No draw, so nothing to animate; the token just proves the server
// issued the offer.

import type { NextRequest } from 'next/server';
import { SPIN_TOKEN_TTL_SECONDS, WELCOME_INDEX } from '@/lib/townies/spin-prizes';
import { createSpinToken, isSpinSigningConfigured } from '@/lib/townies/spin-token';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isSpinSigningConfigured()) {
    return Response.json({ error: 'Not set up yet.' }, { status: 503 });
  }
  if (!rateLimit(`welcome:${callerIp(req.headers)}`, 12, 60_000)) {
    return Response.json({ error: 'Slow down a second.' }, { status: 429 });
  }
  return Response.json(
    { token: await createSpinToken(WELCOME_INDEX), expiresIn: SPIN_TOKEN_TTL_SECONDS },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
