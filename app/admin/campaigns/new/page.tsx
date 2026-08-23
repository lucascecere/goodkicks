import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { CampaignEditor } from '../campaign-editor';
import { getAdminBrand } from '@/lib/admin/brand-server';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  // Seed the sending brand from the global switcher; 'all' means Townies,
  // which is the store now.
  const adminBrand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();
  const { data: rows } = await supabase
    .from('contacts')
    .select('id, name, email, sources, brands')
    .order('created_at', { ascending: false });

  const all = rows ?? [];
  const countMap: Record<string, number> = {};
  for (const c of all) {
    for (const source of c.sources ?? []) {
      countMap[source] = (countMap[source] ?? 0) + 1;
    }
  }

  return (
    <CampaignEditor
      initialBrand={adminBrand === 'goodkicks' ? 'goodkicks' : 'townies'}
      totalContacts={all.length}
      sourceCounts={Object.entries(countMap).map(([source, count]) => ({ source, count }))}
      contacts={all.map((c) => ({ id: c.id, name: c.name ?? null, email: c.email, brands: c.brands ?? [] }))}
    />
  );
}
