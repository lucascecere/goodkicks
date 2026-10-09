'use client';

import { useState, useMemo } from 'react';
import { fmtDate } from '@/lib/admin/format';
import { Badge, PageHeader, Stat, field, type BadgeTone } from '@/components/admin/ui';

export interface CampaignSend {
  id: string;
  email: string;
  contact_name: string | null;
  resend_id: string | null;
  status: 'sent' | 'delivered' | 'opened' | 'bounced' | 'complained';
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
}

interface Props {
  campaign: {
    id: string;
    name: string;
    subject: string;
    sent_at: string | null;
    sent_count: number | null;
  };
  sends: CampaignSend[];
}

type StatusFilter = 'all' | 'delivered' | 'opened' | 'bounced';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getTimestamp(send: CampaignSend): string {
  return send.opened_at ?? send.delivered_at ?? send.bounced_at ?? send.sent_at;
}

const STATUS_TONE: Record<CampaignSend['status'], BadgeTone> = {
  sent:       'neutral',
  delivered:  'info',
  opened:     'good',
  bounced:    'bad',
  complained: 'warn',
};

export function CampaignAnalytics({ campaign, sends }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const stats = useMemo(() => {
    const total = sends.length;
    const delivered = sends.filter((s) => s.status === 'delivered' || s.status === 'opened').length;
    const opened = sends.filter((s) => s.status === 'opened').length;
    const bounced = sends.filter((s) => s.status === 'bounced').length;

    function pct(n: number) {
      if (total === 0) return '0%';
      return `${Math.round((n / total) * 100)}%`;
    }

    return { total, delivered, opened, bounced, pct };
  }, [sends]);

  const filtered = useMemo(() => {
    return sends.filter((s) => {
      if (statusFilter === 'delivered' && s.status !== 'delivered' && s.status !== 'opened') return false;
      if (statusFilter === 'opened' && s.status !== 'opened') return false;
      if (statusFilter === 'bounced' && s.status !== 'bounced') return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.email.toLowerCase().includes(q) ||
          (s.contact_name ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sends, search, statusFilter]);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: sends.length },
    { key: 'delivered', label: 'Delivered', count: sends.filter((s) => s.status === 'delivered' || s.status === 'opened').length },
    { key: 'opened',    label: 'Opened',    count: sends.filter((s) => s.status === 'opened').length },
    { key: 'bounced',   label: 'Bounced',   count: sends.filter((s) => s.status === 'bounced').length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        back={{ href: '/admin/campaigns', label: 'Campaigns' }}
        eyebrow="Campaign"
        title={campaign.name}
        description={campaign.sent_at ? `Sent ${fmtDate(campaign.sent_at)}` : undefined}
        right={<Badge tone="good">Sent</Badge>}
      />

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Sent" value={stats.total} sub="100%" />
        <Stat label="Delivered" value={stats.delivered} sub={stats.pct(stats.delivered)} />
        <Stat label="Opened" value={stats.opened} sub={stats.pct(stats.opened)} />
        <Stat label="Bounced" value={stats.bounced} sub={stats.pct(stats.bounced)} />
      </div>

      {/* Contact table */}
      <div className="overflow-hidden rounded-xl border border-town-cream/10 bg-town-cream/[0.04]">
        {/* Table toolbar */}
        <div className="flex flex-col gap-3 border-b border-town-cream/10 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${field} min-w-0 sm:flex-1`}
          />

          {/* Status filter tabs */}
          <div className="-mx-4 flex flex-shrink-0 items-center gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-town-cream text-town-navy'
                    : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="hidden grid-cols-[1fr_120px_130px] border-b border-town-cream/10 bg-town-cream/[0.03] px-5 py-2.5 sm:grid">
          <span className="admin-eyebrow">Contact</span>
          <span className="admin-eyebrow">Status</span>
          <span className="admin-eyebrow text-right">Timestamp</span>
        </div>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-town-cream/45">
            No contacts match.
          </div>
        ) : (
          <div className="divide-y divide-town-cream/[0.07]">
            {filtered.map((send) => {
              const ts = getTimestamp(send);
              return (
                <div
                  key={send.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 transition-colors hover:bg-town-cream/[0.04] sm:grid-cols-[1fr_120px_130px] sm:gap-x-0 sm:px-5"
                >
                  {/* Name / Email */}
                  <div className="min-w-0 sm:pr-4">
                    {send.contact_name ? (
                      <>
                        <p className="truncate text-sm font-semibold text-town-cream">{send.contact_name}</p>
                        <p className="truncate text-xs text-town-cream/50">{send.email}</p>
                      </>
                    ) : (
                      <p className="truncate text-sm text-town-cream">{send.email}</p>
                    )}
                  </div>

                  {/* Status badge (timestamp sits under it on phones) */}
                  <div className="flex flex-col items-end gap-1 sm:block">
                    <Badge tone={STATUS_TONE[send.status]}>{send.status}</Badge>
                    <span className="text-xs text-town-cream/45 sm:hidden">{relativeTime(ts)}</span>
                  </div>

                  {/* Timestamp */}
                  <div className="hidden text-right sm:block">
                    <span className="text-xs text-town-cream/45">{relativeTime(ts)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
