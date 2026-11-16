import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { createSeller, db } from '@/lib/shop/db';
import { sendAdminApplication } from '@/lib/shop/email';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';
import { BUYER_INTENT, judgeForm } from '@/lib/form-guard';
import { burstHold, quarantine } from '@/lib/form-quarantine';
import { captureSend, reportLead } from '@/lib/lead-monitor';

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
  company: z.string().max(500).optional(), // honeypot: anything in it is a bot
  _t: z.string().max(200).optional(), // signed form token (lib/form-guard.ts)
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

  // Spam guard: bots (trap field, no form token), faker leads, pitches and
  // scams get the same { ok: true } but nothing is created or emailed.
  const verdict = await judgeForm({
    name: b.contact_name,
    email: b.contact_email,
    company: b.name,
    message: b.about,
    hasDetail: true,
    token: b._t,
    honey: b.company,
    buyerIntent: BUYER_INTENT.market,
  });
  const spamPayload = { business: b.name, town: b.town, website: b.website, instagram: b.instagram, about: b.about };
  if (verdict.spam) {
    if (await quarantine({ form: 'market application', brand: 'townies', name: b.contact_name, email: b.contact_email, reasons: verdict.reasons, payload: spamPayload })) return NextResponse.json({ ok: true });
  }
  if (await burstHold('market application', { name: b.contact_name, email: b.contact_email, brand: 'townies' }, spamPayload)) {
    return NextResponse.json({ ok: true });
  }

  // One application per email per day; the in-memory limiter resets per
  // server instance, so this is the limit that actually holds.
  const { count } = await db()
    .from('shop_sellers')
    .select('id', { count: 'exact', head: true })
    .eq('contact_email', b.contact_email.toLowerCase())
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if ((count ?? 0) > 0) return NextResponse.json({ ok: true });

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
  const notify = await captureSend(() => sendAdminApplication(seller));
  if (!notify.ok) console.error('[shop] application email failed', notify.error);

  // Tell the YWF Command Center (after the response; never throws).
  after(() =>
    reportLead({
      site: 'townies',
      externalId: seller.id,
      name: b.contact_name,
      email: b.contact_email,
      phone: b.contact_phone || null,
      company: b.name,
      form: 'market application',
      summary: [`Business: ${b.name} (${b.town})`, b.website && `Website: ${b.website}`, b.instagram && `Instagram: ${b.instagram}`, b.about]
        .filter(Boolean)
        .join('\n'),
      clientNotified: notify.ok,
      notifyError: notify.error,
    }),
  );
  return NextResponse.json({ ok: true });
}
