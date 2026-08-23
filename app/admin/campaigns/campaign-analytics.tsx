'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { fmtDate } from '@/lib/admin/format';

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

const STATUS_BADGE: Record<CampaignSend['status'], string> = {
  sent:       'bg-stone-100 text-stone-600',
  delivered:  'bg-blue-100 text-blue-700',
  opened:     'bg-green-100 text-green-700',
  bounced:    'bg-red-100 text-red-700',
  complained: 'bg-amber-100 text-amber-700',
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
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-4"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Campaigns
        </Link>

        <div className="flex items-start gap-3">
          <h1 className="font-display text-3xl text-white leading-tight">{campaign.name}</h1>
          <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
            Sent
          </span>
        </div>

        {campaign.sent_at && (
          <p className="text-white/40 text-sm mt-1">Sent {fmtDate(campaign.sent_at)}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {/* Total */}
        <div className="bg-white rounded-xl border border-brand-rule px-4 py-4">
          <p className="text-xs text-brand-muted uppercase tracking-widest font-medium mb-1">Total Sent</p>
          <p className="text-2xl font-semibold text-brand-ink">{stats.total}</p>
          <p className="text-xs text-brand-muted mt-0.5">100%</p>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-xl border border-brand-rule px-4 py-4">
          <p className="text-xs text-blue-500 uppercase tracking-widest font-medium mb-1">Delivered</p>
          <p className="text-2xl font-semibold text-brand-ink">{stats.delivered}</p>
          <p className="text-xs text-brand-muted mt-0.5">{stats.pct(stats.delivered)}</p>
        </div>

        {/* Opened */}
        <div className="bg-white rounded-xl border border-brand-rule px-4 py-4">
          <p className="text-xs text-green-600 uppercase tracking-widest font-medium mb-1">Opened</p>
          <p className="text-2xl font-semibold text-brand-ink">{stats.opened}</p>
          <p className="text-xs text-brand-muted mt-0.5">{stats.pct(stats.opened)}</p>
        </div>

        {/* Bounced */}
        <div className="bg-white rounded-xl border border-brand-rule px-4 py-4">
          <p className="text-xs text-red-500 uppercase tracking-widest font-medium mb-1">Bounced</p>
          <p className="text-2xl font-semibold text-brand-ink">{stats.bounced}</p>
          <p className="text-xs text-brand-muted mt-0.5">{stats.pct(stats.bounced)}</p>
        </div>
      </div>

      {/* Contact table */}
      <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
        {/* Table toolbar */}
        <div className="px-5 py-4 border-b border-brand-rule bg-[#FAF7F2] flex items-center gap-3 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-white border border-brand-rule rounded-lg px-3 py-1.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-ink"
          />

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-brand-ink text-white'
                    : 'text-brand-muted hover:text-brand-ink hover:bg-white'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_130px] px-5 py-2 border-b border-brand-rule">
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">Contact</span>
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-medium">Status</span>
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-medium text-right">Timestamp</span>
        </div>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-brand-muted text-sm">
            No contacts match.
          </div>
        ) : (
          <div className="divide-y divide-brand-rule">
            {filtered.map((send) => {
              const ts = getTimestamp(send);
              return (
                <div
                  key={send.id}
                  className="grid grid-cols-[1fr_120px_130px] items-center px-5 py-3 hover:bg-[#FAF7F2] transition-colors"
                >
                  {/* Name / Email */}
                  <div className="min-w-0 pr-4">
                    {send.contact_name ? (
                      <>
                        <p className="text-sm font-medium text-brand-ink truncate">{send.contact_name}</p>
                        <p className="text-xs text-brand-muted truncate">{send.email}</p>
                      </>
                    ) : (
                      <p className="text-sm text-brand-ink truncate">{send.email}</p>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[send.status]}`}>
                      {send.status}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right">
                    <span className="text-xs text-brand-muted">{relativeTime(ts)}</span>
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
