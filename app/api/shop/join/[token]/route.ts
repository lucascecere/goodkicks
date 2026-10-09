import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSellerByToken, listProducts, updateProduct, updateSeller } from '@/lib/shop/db';
import { minPriceCents } from '@/lib/shop/money';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

// A business saving its stall from the join link: info, pickup, and which
// hats to sell at what price. The token in the URL is the only credential, so
// this only ever touches that one business and its own hats.

const Body = z.object({
  blurb: z.string().trim().max(400).optional().default(''),
  town: z.string().trim().max(60).optional().default(''),
  // Shown as links on the public shop page, so only real web links and
  // plain handles get through.
  website: z.union([z.literal(''), z.string().trim().max(200).regex(/^https?:\/\/[^\s]+$/i, 'Website must start with http:// or https://')]).optional().default(''),
  instagram: z.union([z.literal(''), z.string().trim().max(60).regex(/^@?[A-Za-z0-9._]{1,30}$/)]).optional().default(''),
  contact_phone: z.string().trim().max(40).optional().default(''),
  // Stripe needs an email on every payout account.
  contact_email: z.union([z.literal(''), z.string().trim().email().max(120)]).optional().default(''),
  pickup_enabled: z.boolean(),
  pickup_address: z.string().trim().max(200).optional().default(''),
  pickup_notes: z.string().trim().max(300).optional().default(''),
  hats: z
    .array(z.object({ id: z.string().uuid(), sell: z.boolean(), price_cents: z.number().int().positive().nullable() }))
    .max(100),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!rateLimit(`shop-join:${callerIp(req.headers)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many saves. Give it a minute.' }, { status: 429 });
  }
  const { token } = await params;
  const seller = await getSellerByToken(token);
  if (!seller || seller.status === 'rejected') return NextResponse.json({ error: 'This link has expired.' }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    const msg = path === 'website' ? 'Your website needs to start with https://' : path === 'instagram' ? 'Instagram should be just your handle, like @yourshop.' : path === 'contact_email' ? 'That email address looks off.' : 'Something in the form looks off.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const b = parsed.data;

  if (b.pickup_enabled && !b.pickup_address) {
    return NextResponse.json({ error: 'Add the pickup address, or turn pickup off.' }, { status: 400 });
  }

  const products = await listProducts(seller.id);
  const mine = new Map(products.map((p) => [p.id, p]));
  for (const h of b.hats) {
    const p = mine.get(h.id);
    if (!p || p.status === 'archived') continue;
    if (h.sell && (!h.price_cents || h.price_cents < minPriceCents(p.wholesale_cents))) {
      return NextResponse.json(
        { error: `${p.title}: the price has to be at least $${(minPriceCents(p.wholesale_cents) / 100).toFixed(2)}.` },
        { status: 400 },
      );
    }
  }
  for (const h of b.hats) {
    const p = mine.get(h.id);
    if (!p || p.status === 'archived') continue;
    await updateProduct(p.id, { status: h.sell ? 'active' : 'draft', price_cents: h.price_cents ?? p.price_cents });
  }

  await updateSeller(seller.id, {
    blurb: b.blurb || null,
    town: b.town || seller.town,
    website: b.website || null,
    instagram: b.instagram || null,
    contact_phone: b.contact_phone || null,
    contact_email: b.contact_email ? b.contact_email.toLowerCase() : seller.contact_email,
    pickup_enabled: b.pickup_enabled,
    pickup_address: b.pickup_address || null,
    pickup_notes: b.pickup_notes || null,
    joined_at: seller.joined_at ?? new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
