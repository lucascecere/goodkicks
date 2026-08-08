import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminAuthed, loadRep, repCodeLabel, sendWelcomeForRep } from '@/lib/reps/server';
import {
  createRepDiscountCode,
  slugifyCode,
  suggestCode,
  ShopifyScopeError,
  ShopifyNotConfiguredError,
} from '@/lib/shopify/create-discount-code';

// POST { applicationId, discountCode?, discountPct, commissionPct, createInShopify? }
//
// `discountPct` is what the customer saves; `commissionPct` is what the rep
// earns. They are separate numbers — the old single `tierPct` meant an 8%
// commission minted a code giving 8% off.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  const discountPct = Number(body?.discountPct ?? 15);
  const commissionPct = Number(body?.commissionPct ?? 10);
  const createInShopify = body?.createInShopify !== false;

  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }
  for (const [label, value] of [['discountPct', discountPct], ['commissionPct', commissionPct]] as const) {
    if (!Number.isInteger(value) || value < 0 || value > 20) {
      return NextResponse.json({ error: `${label} must be a whole number from 0 to 20` }, { status: 400 });
    }
  }

  const rep = await loadRep(applicationId);
  if (!rep) {
    return NextResponse.json({ error: 'application not found' }, { status: 404 });
  }

  const requestedCode = slugifyCode(String(body?.discountCode ?? ''));
  let discountCode = requestedCode || rep.discount_code || '';
  let shopifyGid = rep.shopify_discount_gid;

  // Create the code in Shopify unless one already exists there for this rep, or
  // the admin explicitly opted out (manual-entry fallback).
  if (createInShopify && !shopifyGid) {
    const code = discountCode || suggestCode(repCodeLabel(rep), discountPct);
    if (!code) {
      return NextResponse.json({ error: 'could not derive a code — enter one manually' }, { status: 400 });
    }
    try {
      const created = await createRepDiscountCode({
        code,
        discountPct,
        brand: rep.brand,
        title:
          rep.brand === 'townies'
            ? `Town Rep — ${rep.town ?? rep.name}`
            : `Ambassador — ${rep.instagram ?? rep.name}`,
      });
      discountCode = created.code;
      shopifyGid = created.gid;
    } catch (err) {
      if (err instanceof ShopifyScopeError) {
        return NextResponse.json(
          { error: err.message, code: 'shopify_scope', requiredScope: err.requiredScope },
          { status: 409 },
        );
      }
      if (err instanceof ShopifyNotConfiguredError) {
        return NextResponse.json({ error: err.message, code: 'shopify_unconfigured' }, { status: 409 });
      }
      const message = err instanceof Error ? err.message : 'failed to create discount code';
      console.error('[approve-ambassador] Discount code error:', err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!discountCode) {
    return NextResponse.json({ error: 'a discount code is required' }, { status: 400 });
  }

  let welcomeEmailId: string;
  try {
    welcomeEmailId = await sendWelcomeForRep(rep, { discountCode, discountPct, commissionPct });
  } catch (err) {
    console.error('[approve-ambassador] Welcome email error:', err);
    // The Shopify code may already exist — say so, and report the real reason
    // rather than a generic failure, so it can actually be acted on.
    const detail = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json(
      { error: `Discount code is ready, but the welcome email failed: ${detail}` },
      { status: 502 },
    );
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('ambassador_applications')
    .update({
      approved: true,
      status: 'approved',
      discount_code: discountCode,
      discount_pct: discountPct,
      commission_pct: commissionPct,
      shopify_discount_gid: shopifyGid,
      welcome_email_sent_at: new Date().toISOString(),
      welcome_email_id: welcomeEmailId,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('[approve-ambassador] DB update failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, discountCode, discountPct, commissionPct, gid: shopifyGid, welcomeEmailId });
}
