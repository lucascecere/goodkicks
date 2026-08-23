import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { isAdminSession } from '@/lib/admin/require-admin';
import { parseBrand } from '@/lib/brand/site-brand';


export async function GET() {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('id,name,subject,status,brand,audience_brands,content_mode,recipient_mode,sent_at,sent_count,failed_count,created_at,updated_at')
    .order('updated_at', { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return new Response('Unauthorized', { status: 401 });
  const body = await req.json();
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      name: body.name || 'Untitled Campaign',
      subject: body.subject || '',
      preheader: body.preheader || null,
      headline: body.headline || null,
      body_text: body.bodyText || null,
      cta_text: body.ctaText || null,
      cta_url: body.ctaUrl || null,
      custom_html: body.customHtml || null,
      content_mode: body.contentMode || 'compose',
      recipient_mode: body.recipientMode || 'all',
      brand: parseBrand(body.brand) ?? 'townies',
      audience_brands: (body.audienceBrands ?? []).filter(parseBrand),
      sources: body.sources || [],
      emails: body.emails || [],
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id });
}
