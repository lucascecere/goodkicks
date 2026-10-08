// Review submissions, from the form at /review (and /review/<token>).
//
// Everything lands as `pending`. Nothing a stranger types reaches the homepage
// without being read first — including from a verified order link, because a
// real buyer can still put somebody's full name or an address in the box.

import type { NextRequest } from 'next/server';
import { submitReview } from '@/lib/reviews/server';
import { getTownieProducts } from '@/lib/shopify/collections';

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

  // Open form: a hat picked from the list. Only a handle that is really in the
  // catalogue is kept, so the field can't be used to pin text to a made-up page.
  let productHandle: string | undefined;
  let productTitle: string | undefined;
  if (!body.token && typeof body.product === 'string' && body.product) {
    const hit = (await getTownieProducts().catch(() => [])).find((p) => p.handle === body.product);
    if (hit) {
      productHandle = hit.handle;
      productTitle = hit.title;
    }
  }

  const result = await submitReview({
    productHandle,
    productTitle,
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
