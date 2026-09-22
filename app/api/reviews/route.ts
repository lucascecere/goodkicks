// Review submissions, from the form at /review (and /review/<token>).
//
// Everything lands as `pending`. Nothing a stranger types reaches the homepage
// without being read first — including from a verified order link, because a
// real buyer can still put somebody's full name or an address in the box.

import type { NextRequest } from 'next/server';
import { submitReview } from '@/lib/reviews/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }

  // Honeypot: a field no human sees and every naive bot fills. Answer 200 so
  // the bot records a success and doesn't come back with something cleverer.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return Response.json({ ok: true, verified: false });
  }

  const result = await submitReview({
    rating: Number(body.rating),
    quote: String(body.quote ?? ''),
    name: String(body.name ?? ''),
    town: body.town ? String(body.town) : undefined,
    email: body.email ? String(body.email) : undefined,
    token: body.token ? String(body.token) : undefined,
    brand: body.brand === 'goodkicks' ? 'goodkicks' : 'townies',
  });

  return Response.json(result, { status: result.ok ? 200 : 400 });
}
