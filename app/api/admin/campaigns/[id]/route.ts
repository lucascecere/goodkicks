import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';
import { parseBrand } from '@/lib/brand/site-brand';


type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('campaigns')
    .update({
      name: body.name,
      subject: body.subject,
      preheader: body.preheader || null,
      headline: body.headline || null,
      body_text: body.bodyText || null,
      cta_text: body.ctaText || null,
      cta_url: body.ctaUrl || null,
      custom_html: body.customHtml || null,
      brand: parseBrand(body.brand) ?? 'townies',
      audience_brands: (body.audienceBrands ?? []).filter(parseBrand),
      content_mode: body.contentMode,
      recipient_mode: body.recipientMode,
      sources: body.sources || [],
      emails: body.emails || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
