// Grade the Mass trivia and hand back a signed prize token, claimed through
// /api/spin/claim exactly like the wheel (Shopify-first minting, one code per
// email). The score sets the tier; the server holds the answers.

import type { NextRequest } from 'next/server';
import { gradeQuiz } from '@/lib/townies/quiz';
import { QUIZ_BASE, QUIZ_PRIZES, quizTier } from '@/lib/townies/spin-prizes';
import { createSpinToken, isSpinSigningConfigured } from '@/lib/townies/spin-token';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isSpinSigningConfigured()) return Response.json({ error: 'Not set up yet.' }, { status: 503 });
  if (!rateLimit(`quiz:${callerIp(req.headers)}`, 10, 60_000)) {
    return Response.json({ error: 'Slow down a second.' }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { picks?: Record<string, string> } | null;
  const result = body?.picks && typeof body.picks === 'object' ? gradeQuiz(body.picks) : null;
  if (!result) return Response.json({ error: 'That quiz didn’t come through. Try again.' }, { status: 400 });

  const tier = quizTier(result.score);
  const prize = QUIZ_PRIZES[tier];
  return Response.json(
    {
      score: result.score,
      // Right/wrong per question only. Returning the answers let anyone farm
      // the bank and script a perfect score.
      correct: result.correct,
      prize: { label: prize.label, terms: prize.terms },
      token: await createSpinToken(QUIZ_BASE + tier),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
