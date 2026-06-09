import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

function isAuthed(req: NextRequest) {
  const cookie = req.cookies.get('gk_admin')?.value;
  return cookie === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.from('product_costs').select('*').order('product_title');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { product_title, unit_cost } = await req.json();
  if (!product_title || unit_cost == null) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('product_costs')
    .upsert({ product_title, unit_cost, updated_at: new Date().toISOString() }, { onConflict: 'product_title' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { product_title } = await req.json();
  if (!product_title) return NextResponse.json({ error: 'missing product_title' }, { status: 400 });
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('product_costs').delete().eq('product_title', product_title);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
