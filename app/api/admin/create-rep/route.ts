import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { upsertContact } from '@/lib/supabase/upsert-contact';
import { isAdminAuthed } from '@/lib/reps/server';
import { parseBrand } from '@/lib/brand/site-brand';

// Add a rep who never went through the public form — someone signed up in
// person or over DM. Creates the same row shape the application form produces,
// so the existing approve → create code → send welcome flow works unchanged.
//
// POST { brand, name, email, instagram, town?, school?, hatDelivered?, age?, notes? }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  // Admin route — no meaningful Host signal, so Townies is the default.
  const brand = parseBrand(body?.brand) ?? 'townies';
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const instagramRaw = String(body?.instagram ?? '').trim();
  const town = String(body?.town ?? '').trim();
  const school = String(body?.school ?? '').trim();

  if (!name || !email) {
    return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'that email does not look right' }, { status: 400 });
  }
  // The rep's code is derived from their town (Townies) or handle (Good Kicks),
  // so the relevant one has to be present or there is nothing to build a code from.
  if (brand === 'townies' && !town) {
    return NextResponse.json({ error: 'town is required — it becomes their code' }, { status: 400 });
  }
  if (brand === 'goodkicks' && !instagramRaw && !school) {
    return NextResponse.json({ error: 'instagram or school is required' }, { status: 400 });
  }

  // Store handles consistently as @handle, accepting a full profile URL too.
  const instagram = instagramRaw
    ? `@${instagramRaw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/+$/, '')}`
    : '';

  const age = Number.isInteger(body?.age) ? (body.age as number) : null;
  const supabase = createSupabaseServiceClient();

  // Don't silently create a second profile for someone who already exists —
  // that would split their sales across two rows.
  const { data: existing } = await supabase
    .from('ambassador_applications')
    .select('id, name, brand')
    .eq('email', email)
    .eq('brand', brand)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `${existing.name} already has a profile with that email.`, existingId: existing.id },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from('ambassador_applications')
    .insert({
      brand,
      name,
      email,
      instagram,
      town: town || null,
      school: school || null,
      hat_preference: String(body?.hatPreference ?? '').trim() || null,
      hat_delivered: Boolean(body?.hatDelivered),
      account_type: body?.accountType ?? null,
      followers: body?.followers ?? null,
      notes: String(body?.notes ?? '').trim() || null,
      age,
      status: 'pending',
      approved: false,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[create-rep]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await upsertContact({ email, name, source: 'ambassador', brand });

  return NextResponse.json({ ok: true, rep: data });
}
