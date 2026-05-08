'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type Ambassador = {
  id: string;
  name: string;
  email: string;
  instagram: string;
  school: string | null;
  account_type: string | null;
  followers: string | null;
  colorway_preference: string | null;
  shipping_address: string | null;
  approved: boolean;
  status: string | null;
  discount_code: string | null;
  tier_pct: number | null;
  created_at: string | null;
  welcome_email_sent_at: string | null;
};

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const TIERS = [8, 12, 16, 20];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatusBadge({ app }: { app: Ambassador }) {
  if (app.approved) return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">approved</span>;
  if (app.status === 'rejected') return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600">rejected</span>;
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">pending</span>;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-brand-muted mb-0.5">{label}</p>
      <p className="text-sm text-brand-ink">{value}</p>
    </div>
  );
}

function RightPanel({
  app,
  onUpdate,
  onDelete,
}: {
  app: Ambassador;
  onUpdate: (id: string, fields: Partial<Ambassador>) => void;
  onDelete: (id: string) => void;
}) {
  const [editCode, setEditCode] = useState(app.discount_code ?? '');
  const [editTier, setEditTier] = useState(app.tier_pct ?? 8);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');
    const res = await fetch('/api/admin/update-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: app.id,
        discount_code: editCode.trim().toUpperCase() || null,
        tier_pct: editTier,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveMsg('saved');
      onUpdate(app.id, { discount_code: editCode.trim().toUpperCase() || null, tier_pct: editTier });
      setTimeout(() => setSaveMsg(''), 2000);
    } else {
      setSaveMsg('save failed');
    }
  }

  async function handleStatusChange(newStatus: 'approved' | 'rejected' | 'pending') {
    const approved = newStatus === 'approved';
    const status = newStatus === 'pending' ? null : newStatus;
    const res = await fetch('/api/admin/update-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, approved, status }),
    });
    if (res.ok) {
      onUpdate(app.id, { approved, status });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch('/api/admin/delete-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    if (res.ok) {
      onDelete(app.id);
    } else {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const followerLabels: Record<string, string> = {
    'under-500': 'Under 500', '500-2k': '500–2k', '2k-10k': '2k–10k', '10k+': '10k+',
  };
  const typeLabels: Record<string, string> = {
    'high-school': 'High School', 'college': 'College', 'freestyle': 'Freestyle', 'general': 'General',
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b border-brand-rule">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <h2 className="font-display text-xl text-brand-ink leading-tight">{app.name}</h2>
            <a href={`mailto:${app.email}`} className="text-xs text-brand-muted hover:text-brand-rust transition-colors truncate block">{app.email}</a>
          </div>
          <StatusBadge app={app} />
        </div>
        {app.instagram && (
          <a
            href={`https://instagram.com/${app.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-rust hover:underline"
          >
            {app.instagram} ↗
          </a>
        )}
      </div>

      {/* Approve CTA — only shown for pending */}
      {!app.approved && app.status !== 'rejected' && (
        <div className="p-5 border-b border-brand-rule">
          <Link
            href={`/admin/ambassadors/${app.id}`}
            className="block w-full text-center bg-brand-rust text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-brand-rust/90 transition-colors"
          >
            approve & send welcome email →
          </Link>
        </div>
      )}

      {/* Details */}
      <div className="p-5 space-y-3 border-b border-brand-rule">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Profile</p>
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Account Type" value={typeLabels[app.account_type ?? ''] ?? app.account_type} />
          <DetailRow label="Followers" value={followerLabels[app.followers ?? ''] ?? app.followers} />
          <DetailRow label="Colorway" value={app.colorway_preference} />
          <DetailRow label="School / Group" value={app.school} />
        </div>
        <DetailRow label="Shipping Address" value={app.shipping_address} />
        {app.created_at && <DetailRow label="Applied" value={fmtDate(app.created_at)} />}
        {app.welcome_email_sent_at && (
          <DetailRow label="Welcome Email Sent" value={fmtDateTime(app.welcome_email_sent_at)} />
        )}
      </div>

      {/* Edit code + tier */}
      {app.approved && (
        <div className="p-5 space-y-3 border-b border-brand-rule">
          <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Discount & Commission</p>
          <div>
            <label className="text-xs text-brand-muted block mb-1">Discount Code</label>
            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
              placeholder="e.g. JOHNDOE15"
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
          </div>
          <div>
            <label className="text-xs text-brand-muted block mb-1">Commission Tier</label>
            <select
              value={editTier}
              onChange={(e) => setEditTier(Number(e.target.value))}
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            >
              {TIERS.map((t) => <option key={t} value={t}>{t}%</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-brand-ink text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-brand-ink/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'saving…' : 'update code & commission'}
            </button>
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg === 'saved' ? 'text-green-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
          </div>
          {app.discount_code && (
            <a
              href={`/ambassador/${app.discount_code.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-rust hover:underline block"
            >
              view stats page →
            </a>
          )}
        </div>
      )}

      {/* Status controls */}
      <div className="p-5 space-y-3 border-b border-brand-rule">
        <p className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">Change Status</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusChange('pending')}
            disabled={!app.approved && app.status !== 'rejected'}
            className="flex-1 text-xs py-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            set pending
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={app.status === 'rejected'}
            className="flex-1 text-xs py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            reject
          </button>
        </div>
      </div>

      {/* Full detail link + delete */}
      <div className="p-5 space-y-3 mt-auto">
        <Link
          href={`/admin/ambassadors/${app.id}`}
          className="block w-full text-center text-sm border border-brand-rule rounded-lg px-4 py-2 text-brand-muted hover:text-brand-ink hover:border-brand-ink transition-colors"
        >
          open full detail page →
        </Link>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="block w-full text-center text-xs text-red-400 hover:text-red-600 transition-colors py-1"
          >
            delete ambassador
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <p className="text-xs text-red-700 font-medium">Permanently delete {app.name}? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded px-3 py-1.5 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'deleting…' : 'yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-red-200 text-red-600 rounded px-3 py-1.5 text-xs hover:bg-white transition-colors"
              >
                cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPanel({ stats }: { stats: { total: number; approved: number; pending: number; rejected: number } }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Approved', value: stats.approved },
          { label: 'Pending', value: stats.pending },
          { label: 'Rejected', value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="bg-brand-rule/30 rounded-xl p-4">
            <p className="text-2xl font-bold text-brand-ink">{s.value}</p>
            <p className="text-xs text-brand-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-brand-muted text-sm mt-2">select an ambassador to manage</p>
    </div>
  );
}

export function AmbassadorsClient({ initial }: { initial: Ambassador[] }) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>(initial);
  const [selected, setSelected] = useState<Ambassador | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    let list = ambassadors;
    if (filter === 'approved') list = list.filter((a) => a.approved);
    else if (filter === 'pending') list = list.filter((a) => !a.approved && a.status !== 'rejected');
    else if (filter === 'rejected') list = list.filter((a) => a.status === 'rejected');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.instagram ?? '').toLowerCase().includes(q) ||
          (a.discount_code ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [ambassadors, filter, search]);

  const stats = useMemo(() => ({
    total: ambassadors.length,
    approved: ambassadors.filter((a) => a.approved).length,
    pending: ambassadors.filter((a) => !a.approved && a.status !== 'rejected').length,
    rejected: ambassadors.filter((a) => a.status === 'rejected').length,
  }), [ambassadors]);

  function handleUpdate(id: string, fields: Partial<Ambassador>) {
    setAmbassadors((prev) => prev.map((a) => (a.id === id ? { ...a, ...fields } : a)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...fields } : prev));
  }

  function handleDelete(id: string) {
    setAmbassadors((prev) => prev.filter((a) => a.id !== id));
    setSelected(null);
  }

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden gap-0">
      {/* Left — list */}
      <div className="flex flex-col w-full lg:w-3/5 shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <h1 className="font-display text-2xl text-white mb-1">Ambassadors</h1>
          <p className="text-white/40 text-xs">{stats.total} total · {stats.pending} pending</p>
        </div>

        {/* Search */}
        <div className="px-6 pb-3 shrink-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search name, email, instagram, code…"
            className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Filter tabs */}
        <div className="px-6 pb-3 flex gap-1.5 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-brand-ink'
                  : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/12'
              }`}
            >
              {tab.label} <span className="opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-white/30 text-sm pt-6 text-center">no results</p>
          ) : (
            filtered.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelected(app)}
                className={`w-full text-left bg-white rounded-xl border px-4 py-3.5 transition-all ${
                  selected?.id === app.id
                    ? 'border-brand-rust shadow-sm'
                    : 'border-brand-rule hover:border-brand-rust/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-brand-ink text-sm truncate">{app.name}</p>
                    <p className="text-brand-muted text-xs mt-0.5 truncate">{app.instagram} · {app.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.discount_code && (
                      <span className="font-mono text-[10px] bg-brand-rule px-1.5 py-0.5 rounded text-brand-muted hidden sm:block">
                        {app.discount_code}
                      </span>
                    )}
                    {app.approved
                      ? <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      : app.status === 'rejected'
                      ? <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      : <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    }
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right — management panel */}
      <div className="hidden lg:flex lg:w-2/5 shrink-0 overflow-hidden border-l border-white/10">
        <div className="flex-1 bg-white rounded-xl m-4 overflow-hidden shadow-sm">
          {selected ? (
            <RightPanel
              key={selected.id}
              app={selected}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : (
            <EmptyPanel stats={stats} />
          )}
        </div>
      </div>
    </div>
  );
}
