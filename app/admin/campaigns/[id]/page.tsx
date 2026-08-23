import { notFound } from 'next/navigation';
import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { CampaignEditor } from '../campaign-editor';
import { CampaignAnalytics } from '../campaign-analytics';
import type { CampaignSend } from '../campaign-analytics';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (!campaign) notFound();

  // Sent campaign → show analytics view
  if (campaign.status === 'sent') {
    const { data: sends } = await supabase
      .from('campaign_sends')
      .select('id, email, contact_name, resend_id, status, sent_at, delivered_at, opened_at, bounced_at, complained_at')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: false });

    return (
      <CampaignAnalytics
        campaign={{
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          sent_at: campaign.sent_at,
          sent_count: campaign.sent_count,
        }}
        sends={(sends ?? []) as CampaignSend[]}
      />
    );
  }

  // Draft campaign → show editor
  const { data: rows } = await supabase
    .from('contacts')
    .select('id, name, email, sources, brands')
    .order('created_at', { ascending: false });

  const all = rows ?? [];
  const countMap: Record<string, number> = {};
  for (const c of all) {
    for (const source of (c.sources ?? []) as string[]) {
      countMap[source] = (countMap[source] ?? 0) + 1;
    }
  }

  return (
    <CampaignEditor
      initialCampaign={{
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        preheader: campaign.preheader,
        headline: campaign.headline,
        body_text: campaign.body_text,
        cta_text: campaign.cta_text,
        cta_url: campaign.cta_url,
        custom_html: campaign.custom_html,
        brand: campaign.brand ?? 'townies',
        audience_brands: campaign.audience_brands ?? [],
        content_mode: campaign.content_mode,
        recipient_mode: campaign.recipient_mode,
        sources: campaign.sources ?? [],
        emails: campaign.emails ?? [],
        status: campaign.status,
      }}
      totalContacts={all.length}
      sourceCounts={Object.entries(countMap).map(([source, count]) => ({ source, count }))}
      contacts={all.map((c) => ({ id: c.id, name: c.name ?? null, email: c.email, brands: c.brands ?? [] }))}
    />
  );
}
