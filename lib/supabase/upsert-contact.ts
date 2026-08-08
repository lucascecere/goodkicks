import { createSupabaseServiceClient } from './client';
import type { RealBrand } from '@/lib/admin/brand';

export type ContactSource = 'ambassador' | 'discount' | 'newsletter' | 'contact' | 'order';

/**
 * Upsert a person into the unified contacts list.
 *
 * `brand` is optional and only meaningful for order-derived contacts — a
 * newsletter signup isn't inherently Townies or Good Kicks. The RPC UNIONS the
 * brand in rather than replacing it, so somebody who buys from both ends up
 * tagged with both.
 *
 * Server-only: the RPC is SECURITY DEFINER and executable by the service role
 * alone.
 */
export async function upsertContact({
  email,
  name,
  source,
  brand,
}: {
  email: string;
  name?: string | null;
  source: ContactSource;
  brand?: RealBrand | null;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.rpc('upsert_contact', {
    p_email: email.toLowerCase().trim(),
    p_name: name ?? null,
    p_source: source,
    p_brand: brand ?? null,
  });
  if (error) console.error('[upsertContact]', error.message);
}
