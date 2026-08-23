// Draw a prize.
//
// The browser asks "what did I win?" and gets back a wedge index plus a signed,
// short-lived token proving the server picked it. The wheel then animates to
// that wedge. Nothing about the outcome is decided client-side, so opening dev
// tools and calling spin() by hand gets you exactly the same odds as clicking
// the button.
//
// Nothing is written to the database here — an unclaimed spin is not a lead,
// and recording one would inflate the numbers with people who never gave an
// email. The write happens in ./claim.

import type { NextRequest } from 'next/server';
import { drawWedgeIndex, SPIN_TOKEN_TTL_SECONDS, WEDGES } from '@/lib/townies/spin-prizes';
import { createSpinToken, isSpinSigningConfigured } from '@/lib/townies/spin-token';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isSpinSigningConfigured()) {
    // Refusing is the right call: without a signing key the token is forgeable,
    // and a forgeable token hands out the best prize on the wheel to anyone who
    // edits it. Better a popup that doesn't spin than one that always pays out.
    console.error('[spin] No SPIN_SECRET / ADMIN_SESSION_SECRET / ADMIN_PASSWORD — cannot sign spins.');
    return Response.json({ error: 'The wheel is not set up yet.' }, { status: 503 });
  }

  if (!rateLimit(`spin:${callerIp(req.headers)}`, 12, 60_000)) {
    return Response.json({ error: 'Slow down a second.' }, { status: 429 });
  }

  const wedge = drawWedgeIndex();

  return Response.json(
    {
      wedge,
      token: await createSpinToken(wedge),
      expiresIn: SPIN_TOKEN_TTL_SECONDS,
      // Echoed so the client can assert its copy of the prize table matches the
      // server's. A stale cached bundle after a prize change would otherwise
      // animate to the wrong wedge and show the wrong prize.
      wedgeCount: WEDGES.length,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
