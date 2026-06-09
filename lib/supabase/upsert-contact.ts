import { createSupabaseServiceClient } from './client';

export type ContactSource = 'ambassador' | 'discount' | 'newsletter' | 'contact' | 'order';

export async function upsertContact({
  email,
  name,
  source,
}: {
  email: string;
  name?: string | null;
  source: ContactSource;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc('upsert_contact', {
    p_email: email.toLowerCase().trim(),
    p_name: name ?? null,
    p_source: source,
  });
  if (error) console.error('[upsertContact]', error.message);
}
