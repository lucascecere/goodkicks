import Link from 'next/link';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { CampaignsList } from './campaigns-list';
import { PageHeader, btn } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const supabase = createSupabaseServiceClient();
  const { data } = await supabase
    .from('campaigns')
    .select('id,name,subject,status,brand,sent_at,sent_count,failed_count,updated_at,created_at')
    .order('updated_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Marketing"
        title="Campaigns"
        description="drafts and sent history"
        right={
          <Link href="/admin/campaigns/new" className={btn.primary}>
            + New Campaign
          </Link>
        }
      />

      <CampaignsList initialCampaigns={data ?? []} />
    </div>
  );
}
