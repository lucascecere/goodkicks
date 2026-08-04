import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { getDiscountReadiness } from '@/lib/shopify/discount-readiness';
import { AmbassadorsClient } from './ambassadors-client';

export const dynamic = 'force-dynamic';

export default async function AdminAmbassadorsPage() {
  const brand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();

  let query = supabase
    .from('ambassador_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (brand !== 'all') query = query.eq('brand', brand);

  // Checked up front so the approve panel can show the by-hand flow directly
  // rather than making the admin fail once per rep to discover it.
  const [{ data: apps }, discounts] = await Promise.all([query, getDiscountReadiness()]);

  return <AmbassadorsClient initial={apps ?? []} brand={brand} discounts={discounts} />;
}
