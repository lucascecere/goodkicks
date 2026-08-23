'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandBadge } from '@/components/admin/brand-badge';
import type { RealBrand } from '@/lib/admin/brand';

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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAF7F2] transition-colors group">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <BrandBadge brand={campaign.brand ?? 'townies'} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
            campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {campaign.status}
          </span>
          <p className="text-sm font-medium text-brand-ink truncate">{campaign.name}</p>
        </div>
        <p className="text-xs text-brand-muted truncate">{campaign.subject || <span className="italic">no subject</span>}</p>
        <p className="text-xs text-brand-muted mt-0.5">
          {campaign.status === 'sent' && campaign.sent_at
            ? `Sent ${fmtDate(campaign.sent_at)} · ${campaign.sent_count ?? 0} contacts`
            : `Updated ${fmtRelative(campaign.updated_at)}`}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href={`/admin/campaigns/${campaign.id}`}
          className="text-xs text-brand-rust hover:underline font-medium px-2 py-1">
          {campaign.status === 'draft' ? 'Edit' : 'View'}
        </Link>
        {!confirming ? (
          <button onClick={() => setConfirming(true)}
            className="text-xs text-brand-muted hover:text-red-500 transition-colors px-2 py-1">
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-brand-muted">Sure?</span>
            <button onClick={handleDelete} disabled={deleting}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-1">
              {deleting ? '…' : 'Yes'}
            </button>
            <button onClick={() => setConfirming(false)} className="text-xs text-brand-muted hover:text-brand-ink px-1">No</button>
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
        <div className="bg-white rounded-xl border border-brand-rule px-5 py-12 text-center">
          <p className="text-brand-muted text-sm">No campaigns yet. Create your first one above.</p>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-rule bg-[#FAF7F2]">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Drafts</p>
          </div>
          <div className="divide-y divide-brand-rule">
            {drafts.map((c) => <CampaignRow key={c.id} campaign={c} onDelete={handleDelete} />)}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-rule bg-[#FAF7F2]">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Sent</p>
          </div>
          <div className="divide-y divide-brand-rule">
            {sent.map((c) => <CampaignRow key={c.id} campaign={c} onDelete={handleDelete} />)}
          </div>
        </div>
      )}
    </div>
  );
}
