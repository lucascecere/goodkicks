// Claim a spin: mint the code, email it, record it.
//
// Order matters here. The code is created in Shopify FIRST, and only a code
// that Shopify confirmed gets emailed. The alternative — email now, create
// later — is how 21 Good Kicks ambassadors ended up holding codes that had
// never existed in the store. If Shopify says no, the visitor is told so and
// keeps their spin.

import type { NextRequest } from 'next/server';
import { wedgeAt, wedgeById } from '@/lib/townies/spin-prizes';
import { verifySpinToken } from '@/lib/townies/spin-token';
import { callerIp, hashIp, rateLimit } from '@/lib/townies/spin-ratelimit';
import { mintSpinCode, ShopifyNotConfiguredError, ShopifyScopeError } from '@/lib/shopify/create-spin-code';
import { sendSpinCodeEmail } from '@/lib/email/send-spin-code';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deliberately loose. The job is to reject typos and obvious junk, not to
// adjudicate RFC 5322 — an over-strict pattern rejects real addresses, and the
// only real proof an address works is that the email arrives.
const EMAIL_RE = /^[^\s@]+@[^\s@,]+\.[a-z]{2,}$/i;

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = '23505';

type ClaimRow = {
  discount_code: string;
  expires_at: string | null;
  prize_id: string;
};

export async function POST(req: NextRequest) {
  const ip = callerIp(req.headers);
  if (!rateLimit(`claim:${ip}`, 6, 60_000)) {
    return Response.json({ error: 'Slow down a second.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { token?: unknown; email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: 'That email address does not look right.' }, { status: 400 });
  }

  const payload = await verifySpinToken(body?.token);
  if (!payload) {
    return Response.json(
      { error: 'That spin has expired. Give the wheel another go.', code: 'expired' },
      { status: 400 },
    );
  }

  const wedge = wedgeAt(payload.w);
  if (!wedge) {
    // A validly-signed token pointing at a wedge that no longer exists means
    // the prize table changed under a spin that was already in flight.
    return Response.json(
      { error: 'The wheel changed while you were spinning. One more go?', code: 'expired' },
      { status: 409 },
    );
  }

  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? createSupabaseServiceClient() : null;

  // One code per person. Somebody who already claimed gets their ORIGINAL code
  // back rather than an error or a second code — the truthful answer to "what
  // did I win?" is the prize they actually hold.
  //
  // Described by the STORED prize, not by the wedge they just landed on. Those
  // differ whenever somebody spins a second time, and answering with the new
  // wedge's terms would print "20% off" above a code that takes 10% off.
  //
  // The email is deliberately not re-sent: /api/spin/claim is unauthenticated,
  // so a resend on demand is a way to mail somebody else's inbox on repeat.
  if (supabase) {
    const { data: existing } = await supabase
      .from('spin_claims')
      .select('discount_code, expires_at, prize_id')
      .eq('email', email)
      .eq('brand', 'townies')
      .maybeSingle<ClaimRow>();

    if (existing?.discount_code) {
      const held = wedgeById(existing.prize_id);
      return Response.json({
        ok: true,
        code: existing.discount_code,
        expiresAt: existing.expires_at,
        terms: held?.terms ?? '',
        prizeLabel: held?.label ?? '',
        prizeExit: held?.exit ?? '',
        emailed: false,
        alreadyClaimed: true,
      });
    }
  }

  let minted;
  try {
    minted = await mintSpinCode({ wedge, brand: 'townies' });
  } catch (err) {
    if (err instanceof ShopifyNotConfiguredError || err instanceof ShopifyScopeError) {
      // Operator error, not visitor error. Log it loudly and say something
      // human — never invent a code to paper over it.
      console.error('[spin/claim] Shopify is not able to mint codes:', err.message);
      return Response.json(
        { error: 'We could not lock in your code just now. Try again in a minute.' },
        { status: 503 },
      );
    }
    console.error('[spin/claim] mint failed:', err);
    return Response.json(
      { error: 'We could not lock in your code just now. Try again in a minute.' },
      { status: 502 },
    );
  }

  // Record before emailing: the row is the receipt, and a claim that got a code
  // but no row would let the same person spin again for a second one.
  let claimStored = false;
  if (supabase) {
    const { error } = await supabase.from('spin_claims').insert({
      email,
      brand: 'townies',
      prize_id: wedge.id,
      prize_label: wedge.label,
      discount_code: minted.code,
      discount_kind: wedge.kind,
      percent_off: wedge.percentOff ?? null,
      shopify_discount_gid: minted.gid,
      expires_at: minted.expiresAt,
      token_nonce: payload.n,
      ip_hash: await hashIp(ip),
    });

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        // Two tabs, or a double-submit. The code above was already minted, so
        // it's orphaned — harmless (usage limit 1, expires by itself), and far
        // better than handing back a second live code.
        console.warn('[spin/claim] duplicate claim, orphaning', minted.code);
        return Response.json(
          { error: 'Looks like that spin was already claimed — check your inbox.', code: 'duplicate' },
          { status: 409 },
        );
      }
      // Not fatal to the visitor: they have a real, working code. Log it so the
      // row can be reconciled by hand.
      console.error('[spin/claim] could not record claim', error.message, minted.code, email);
    } else {
      claimStored = true;
    }
  }

  // Hardcoded, and correct: RotarySpin only mounts when the page is NOT Good
  // Kicks (components/layout/site-wrapper.tsx), and spin_claims/mintSpinCode
  // above are hardcoded to match. Don't "fix" this to a derived brand — the
  // prize wedges are Townies-only, so a Good Kicks spin isn't a thing.
  await upsertContact({ email, source: 'discount', brand: 'townies' });

  let emailed = false;
  try {
    const messageId = await sendSpinCodeEmail({
      to: email,
      wedge,
      code: minted.code,
      expiresAt: minted.expiresAt,
    });
    emailed = true;
    if (supabase && claimStored) {
      await supabase.from('spin_claims').update({ email_message_id: messageId }).eq('token_nonce', payload.n);
    }
  } catch (err) {
    // The code is real and the success screen shows it, so a failed send is a
    // degraded win rather than a loss. Say so instead of claiming it sent.
    console.error('[spin/claim] email send failed:', err);
  }

  return Response.json({
    ok: true,
    code: minted.code,
    expiresAt: minted.expiresAt,
    terms: wedge.terms,
    prizeLabel: wedge.label,
    prizeExit: wedge.exit,
    emailed,
    alreadyClaimed: false,
  });
}
