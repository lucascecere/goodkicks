import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';
import { isValidPct, MAX_PCT } from '@/lib/reps/pct';
import { loadRep } from '@/lib/reps/server';
import { updateRepDiscountCode, ShopifyScopeError } from '@/lib/shopify/create-discount-code';

const ALLOWED = [
  'discount_code',
  'discount_pct',
  'commission_pct',
  'tier_pct',
  'status',
  'approved',
  'notes',
  'email',
  'name',
  'instagram',
  'brand',
  'town',
  'school',
  'hat_preference',
  'hat_delivered',
  'account_type',
  'followers',
  'colorway_preference',
  'shipping_address',
  'age',
  'shopify_discount_gid',
] as const;

const PERCENT_FIELDS = ['discount_pct', 'commission_pct'] as const;

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { applicationId, ...fields } = await req.json();
  if (!applicationId) {
    return NextResponse.json({ error: 'missing applicationId' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in fields) update[key] = fields[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 });
  }

  // The DB has check constraints on these; fail with a readable message rather
  // than a raw Postgres violation.
  for (const key of PERCENT_FIELDS) {
    if (update[key] === null || update[key] === undefined) continue;
    const value = Number(update[key]);
    if (!isValidPct(value)) {
      return NextResponse.json({ error: `${key} must be a whole number from 0 to ${MAX_PCT}` }, { status: 400 });
    }
    update[key] = value;
  }

  // Keep the live Shopify code in step with the admin. Without this the stored
  // percentage and the percentage customers actually get silently diverge.
  let shopifySynced: boolean | undefined;
  let shopifyWarning: string | undefined;
  if ('discount_pct' in update && update.discount_pct != null) {
    const rep = await loadRep(applicationId);
    if (rep?.shopify_discount_gid && rep.discount_pct !== update.discount_pct) {
      try {
        await updateRepDiscountCode({
          gid: rep.shopify_discount_gid,
          discountPct: Number(update.discount_pct),
        });
        shopifySynced = true;
      } catch (err) {
        shopifySynced = false;
        shopifyWarning =
          err instanceof ShopifyScopeError
            ? err.message
            : `Saved, but Shopify was not updated: ${err instanceof Error ? err.message : 'unknown error'}`;
        console.error('[update-ambassador] Shopify sync failed:', err);
      }
    }
  }

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('ambassador_applications')
    .update(update)
    .eq('id', applicationId);

  if (error) {
    console.error('[update-ambassador]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, shopifySynced, shopifyWarning });
}
