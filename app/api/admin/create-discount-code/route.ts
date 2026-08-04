import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminAuthed, loadRep, repCodeLabel } from '@/lib/reps/server';
import {
  createRepDiscountCode,
  slugifyCode,
  suggestCode,
  ShopifyScopeError,
  ShopifyNotConfiguredError,
} from '@/lib/shopify/create-discount-code';

// POST { applicationId, code?, discountPct } → creates the code in Shopify,
// scoped to the rep's brand collection, and persists it.
export async function POST(req: NextRequest) {
  if (!isAdminAuthed(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const applicationId = body?.applicationId as string | undefined;
  const discountPct = Number(body?.discountPct ?? 15);

  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }
  if (!Number.isInteger(discountPct) || discountPct < 1 || discountPct > 20) {
    return NextResponse.json({ error: 'discountPct must be a whole number from 1 to 20' }, { status: 400 });
  }

  const rep = await loadRep(applicationId);
  if (!rep) {
    return NextResponse.json({ error: 'application not found' }, { status: 404 });
  }

  const code = slugifyCode(String(body?.code ?? '')) || suggestCode(repCodeLabel(rep), discountPct);
  if (!code) {
    return NextResponse.json({ error: 'could not derive a code — enter one manually' }, { status: 400 });
  }

  let created: { code: string; gid: string };
  try {
    created = await createRepDiscountCode({
      code,
      discountPct,
      brand: rep.brand,
      title:
        rep.brand === 'townies'
          ? `Town Rep — ${rep.town ?? rep.name}`
          : `Ambassador — ${rep.instagram ?? rep.name}`,
    });
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
    console.error('[create-discount-code]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('ambassador_applications')
    .update({
      discount_code: created.code,
      discount_pct: discountPct,
      shopify_discount_gid: created.gid,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('[create-discount-code] DB update failed:', error.message);
    // The Shopify code exists — surface the gid so it isn't orphaned silently.
    return NextResponse.json(
      { error: `Shopify code ${created.code} was created, but saving it failed: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, code: created.code, gid: created.gid });
}
