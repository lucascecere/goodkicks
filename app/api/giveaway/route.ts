import { after } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { sendEmail } from '@/lib/email/resend-client';
import { TOWNIES_FROM } from '@/lib/email/send-rep-welcome';
import { scoreSpam } from '@/lib/spam';
import { callerIp, rateLimit } from '@/lib/townies/spin-ratelimit';
import { BUYER_INTENT, judgeForm } from '@/lib/form-guard';
import { quarantine } from '@/lib/form-quarantine';
import { getTownieProducts } from '@/lib/shopify/collections';
import { townPages } from '@/lib/townies/towns';
import { GIVEAWAY, OTHER_TOWN, giveawayOpen } from '@/lib/townies/giveaway';
import { SITE_URL } from '@/lib/seo/site';

// Website entries for the town hat giveaway. One row per person per town
// (unique campaign+email+town); entering the same town twice just says "you're
// in". Entrants join the Townies contact list (source 'giveaway'). No inbox
// alert: entries are read from the table when winners are picked.

const schema = z.object({
  town: z.string().min(1, 'Pick your town').max(60),
  otherTown: z.string().max(60).optional(),
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().email('Valid email is required').max(200),
  igHandle: z.string().trim().max(40).optional(),
  utm: z.string().max(40).optional(),
});

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(`giveaway:${callerIp(request.headers)}`, 12, 60 * 60 * 1000)) {
      return Response.json({ ok: false, error: 'Too many entries from here. Try again in a bit.' }, { status: 429 });
    }
    if (!giveawayOpen()) {
      return Response.json({ ok: false, error: 'This giveaway has closed.' }, { status: 410 });
    }
    const body = await request.json();
    const who = {
      form: 'giveaway',
      brand: 'townies',
      name: typeof body?.name === 'string' ? body.name : null,
      email: typeof body?.email === 'string' ? body.email : null,
    };
    const payload = { town: body?.town ?? null, otherTown: body?.otherTown ?? null, igHandle: body?.igHandle ?? null };

    // Bots get the same { ok: true } a person does, but nothing is saved.
    if (typeof body?._hp === 'string' && body._hp.trim()) {
      if (await quarantine({ ...who, reasons: ['honeypot'], payload })) return Response.json({ ok: true });
    }
    const spam = scoreSpam({
      fields: [body?.name, body?.otherTown].map((v) => (typeof v === 'string' ? v : '')),
      email: typeof body?.email === 'string' ? body.email : undefined,
      submitAfterMs: typeof body?._ms === 'number' ? body._ms : undefined,
    });
    if (spam.isSpam) {
      if (await quarantine({ ...who, reasons: spam.reasons, payload })) return Response.json({ ok: true });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' }, { status: 400 });
    }
    const d = parsed.data;

    const verdict = await judgeForm({
      name: d.name,
      email: d.email,
      message: d.otherTown ?? '',
      hasDetail: true,
      token: body?._t,
      honey: body?._hp,
      buyerIntent: BUYER_INTENT.hats,
    });
    if (verdict.spam) {
      if (await quarantine({ ...who, reasons: verdict.reasons, payload })) return Response.json({ ok: true });
    }

    // The town must be one we actually make (or "other" with a name typed).
    const towns = townPages(await getTownieProducts());
    const town = towns.find((t) => t.slug === d.town);
    if (!town && d.town !== OTHER_TOWN) {
      return Response.json({ ok: false, error: 'Pick your town from the list.' }, { status: 400 });
    }
    if (d.town === OTHER_TOWN && !d.otherTown?.trim()) {
      return Response.json({ ok: false, error: 'Type your town.' }, { status: 400 });
    }

    const email = d.email.toLowerCase();
    const supabase = createSupabaseServiceClient();
    const { data: inserted, error } = await supabase
      .from('giveaway_entries')
      .upsert(
        {
          campaign: GIVEAWAY.campaign,
          town: d.town,
          other_town: d.town === OTHER_TOWN ? d.otherTown!.trim() : null,
          name: d.name,
          email,
          ig_handle: d.igHandle?.replace(/^@/, '') || null,
          utm_source: d.utm || null,
        },
        { onConflict: 'campaign,email,town', ignoreDuplicates: true },
      )
      .select('id');
    if (error) {
      console.error('[giveaway] insert error:', error.message);
      return Response.json({ ok: false, error: 'Something went wrong. Try again.' }, { status: 500 });
    }
    const isNew = (inserted?.length ?? 0) > 0;

    await upsertContact({ email, name: d.name, source: 'giveaway', brand: 'townies' });

    // Confirmation, first entry per town only. Never blocks the response.
    if (isNew && town && process.env.RESEND_API_KEY) {
      const url = `${SITE_URL}/towns/${town.slug}?utm_source=giveaway&utm_medium=email&utm_campaign=${GIVEAWAY.campaign}`;
      const first = esc(d.name.split(/\s+/)[0] ?? '');
      after(async () => {
        try {
          await sendEmail({
            from: TOWNIES_FROM,
            to: email,
            subject: `You're in for the ${town.name} hat`,
            text: `${first ? `${first}, you're` : "You're"} entered to win the ${town.name} hat. We pick one winner from ${town.name} on ${GIVEAWAY.pickLabel} and email them that day.\n\nWant to double your odds? Follow @townies.shop on Instagram and comment ${town.name.toUpperCase()} on the giveaway post.\n\nDon't want to wait? ${url}\n\nTownies`,
            html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#0D1B2A;background:#F2EFE8">
<p style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#2F4F3A;font-weight:700;margin:0 0 10px">Giveaway</p>
<h1 style="font-size:26px;margin:0 0 14px">You're in for the ${esc(town.name)} hat.</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 14px">${first ? `${first}, you're` : "You're"} entered. We pick one winner from ${esc(town.name)} on ${GIVEAWAY.pickLabel} and email them that day.</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 22px">Want another entry? Follow <a href="https://instagram.com/townies.shop" style="color:#0D1B2A">@townies.shop</a> and comment <b>${esc(town.name.toUpperCase())}</b> on the giveaway post.</p>
<a href="${url}" style="display:inline-block;background:#0D1B2A;color:#F2EFE8;text-decoration:none;padding:13px 22px;border-radius:3px;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">See the ${esc(town.name)} hat</a>
<p style="font-size:12px;color:#8F918D;margin:28px 0 0">No purchase necessary. One entry per person per town on the website. Not sponsored by or affiliated with Instagram.</p>
</div>`,
          });
        } catch (e) {
          console.error('[giveaway] confirmation email failed:', (e as Error).message);
        }
      });
    }

    return Response.json({ ok: true, already: !isNew });
  } catch {
    return Response.json({ ok: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
