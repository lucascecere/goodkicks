import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSeller } from '@/lib/shop/db';
import { sendAdminApplication } from '@/lib/shop/email';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';

// A business we don't know yet asking for a stall. Lands as 'applied' and
// shows up in Admin › Market for review; nothing goes live from here.

const Body = z.object({
  name: z.string().trim().min(2).max(80),
  town: z.string().trim().min(2).max(60),
  contact_name: z.string().trim().min(2).max(80),
  contact_email: z.string().trim().email().max(120),
  contact_phone: z.string().trim().max(40).optional().default(''),
  website: z.string().trim().max(200).optional().default(''),
  instagram: z.string().trim().max(100).optional().default(''),
  about: z.string().trim().min(10).max(1200),
  has_logo: z.enum(['yes', 'no', 'not_sure']),
  company: z.string().max(0).optional(), // honeypot
});

export async function POST(req: Request) {
  if (!rateLimit(`shop-apply:${callerIp(req.headers)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Thanks, we already have your application.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Fill in every required field, then try again.' }, { status: 400 });
  }
  const b = parsed.data;
  if (b.company) return NextResponse.json({ ok: true });

  const seller = await createSeller({
    name: b.name,
    town: b.town,
    status: 'applied',
    source_type: 'cold_applicant',
    contact_name: b.contact_name,
    contact_email: b.contact_email.toLowerCase(),
    contact_phone: b.contact_phone || null,
    website: b.website || null,
    instagram: b.instagram || null,
    application: { about: b.about, has_logo: b.has_logo, submitted_at: new Date().toISOString() },
  });
  try {
    await sendAdminApplication(seller);
  } catch (err) {
    console.error('[shop] application email failed', err);
  }
  return NextResponse.json({ ok: true });
}
