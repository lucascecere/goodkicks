import Link from 'next/link';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { CampaignsList } from './campaigns-list';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from('campaigns')
    .select('id,name,subject,status,brand,sent_at,sent_count,failed_count,updated_at,created_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Campaigns</h1>
          <p className="text-white/40 text-sm mt-1">drafts and sent history</p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="bg-brand-rust text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-rust/90 transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      <CampaignsList initialCampaigns={data ?? []} />
    </div>
  );
}
