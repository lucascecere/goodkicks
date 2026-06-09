import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { CampaignEditor } from '../campaign-editor';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  const supabase = createSupabaseServiceClient();
  const { data: rows } = await supabase
    .from('contacts')
    .select('id, name, email, sources')
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
      totalContacts={all.length}
      sourceCounts={Object.entries(countMap).map(([source, count]) => ({ source, count }))}
      contacts={all.map((c) => ({ id: c.id, name: c.name ?? null, email: c.email }))}
    />
  );
}
