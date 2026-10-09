'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandBadge } from '@/components/admin/brand-badge';
import type { RealBrand } from '@/lib/admin/brand';
import { fmtDate } from '@/lib/admin/format';
import { Badge, Card, EmptyState } from '@/components/admin/ui';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'sent';
  brand?: RealBrand | null;
  sent_at: string | null;
  sent_count: number | null;
  failed_count: number | null;
  updated_at: string;
  created_at: string;
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(iso);
}

function CampaignRow({ campaign, onDelete }: { campaign: Campaign; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/admin/campaigns/${campaign.id}`, { method: 'DELETE' });
    onDelete(campaign.id);
  }

  return (
    <div className="group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-town-cream/[0.04] sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
          <BrandBadge brand={campaign.brand ?? 'townies'} />
          <Badge tone={campaign.status === 'sent' ? 'good' : 'warn'}>{campaign.status}</Badge>
          <p className="min-w-0 truncate text-sm font-semibold text-town-cream">{campaign.name}</p>
        </div>
        <p className="truncate text-xs text-town-cream/60">{campaign.subject || <span className="italic">no subject</span>}</p>
        <p className="mt-0.5 text-xs text-town-cream/45">
          {campaign.status === 'sent' && campaign.sent_at
            ? `Sent ${fmtDate(campaign.sent_at)} · ${campaign.sent_count ?? 0} contacts`
            : `Updated ${fmtRelative(campaign.updated_at)}`}
        </p>
      </div>

      <div className="-ml-2 flex flex-shrink-0 items-center gap-2 sm:ml-0">
        <Link href={`/admin/campaigns/${campaign.id}`}
          className="px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-town-cream hover:underline">
          {campaign.status === 'draft' ? 'Edit' : 'View'}
        </Link>
        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-town-cream/50 transition-colors hover:text-red-300">
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-town-cream/50">Sure?</span>
            <button onClick={handleDelete} disabled={deleting}
              className="px-1 text-xs font-semibold text-red-300 hover:text-red-200">
              {deleting ? '…' : 'Yes'}
            </button>
            <button onClick={() => setConfirming(false)} className="px-1 text-xs text-town-cream/50 hover:text-town-cream">No</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CampaignsList({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  function handleDelete(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  const drafts = campaigns.filter((c) => c.status === 'draft');
  const sent = campaigns.filter((c) => c.status === 'sent');

  return (
    <div className="space-y-6">
      {campaigns.length === 0 && (
        <EmptyState title="No campaigns yet" body="Create your first one above." />
      )}

      {drafts.length > 0 && (
        <Card title="Drafts" className="overflow-hidden">
          <div className="divide-y divide-town-cream/[0.07]">
            {drafts.map((c) => <CampaignRow key={c.id} campaign={c} onDelete={handleDelete} />)}
          </div>
        </Card>
      )}

      {sent.length > 0 && (
        <Card title="Sent" className="overflow-hidden">
          <div className="divide-y divide-town-cream/[0.07]">
            {sent.map((c) => <CampaignRow key={c.id} campaign={c} onDelete={handleDelete} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
