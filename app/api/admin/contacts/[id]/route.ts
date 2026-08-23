import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';
import { parseBrand, type RealBrand } from '@/lib/brand/site-brand';


export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ['name', 'email', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // `brands` is handled apart from the string allowlist because it is the one
  // field that must be REPLACED rather than unioned. upsert_contact may only
  // ever ADD a brand — deliberately, so no unauthenticated form post can erase
  // one — which makes this route the only way a wrong tag ever comes off.
  // An empty array is legal and means "clear the tag".
  if ('brands' in body) {
    if (!Array.isArray(body.brands)) {
      return NextResponse.json({ error: 'brands must be an array' }, { status: 400 });
    }
    const parsed = body.brands.map(parseBrand);
    if (parsed.some((b: RealBrand | null) => b === null)) {
      return NextResponse.json({ error: 'unknown brand' }, { status: 400 });
    }
    updates.brands = [...new Set(parsed as RealBrand[])];
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('contacts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
