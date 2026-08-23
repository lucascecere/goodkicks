'use client';

import { useState, useMemo } from 'react';
import { SyncShopifyButton } from './sync-button';
import { BrandBadge } from '@/components/admin/brand-badge';
import { BRAND_LABELS, type AdminBrand, type RealBrand } from '@/lib/admin/brand';

export type Contact = {
  id: string;
  email: string;
  name: string | null;
  notes: string | null;
  sources: string[];
  brands: string[];
  created_at: string;
};

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  ambassador: { label: 'ambassador', cls: 'bg-amber-100 text-amber-700' },
  discount:   { label: 'discount',   cls: 'bg-purple-100 text-purple-700' },
  newsletter: { label: 'newsletter', cls: 'bg-blue-100 text-blue-700' },
  contact:    { label: 'contact',    cls: 'bg-gray-100 text-gray-600' },
  order:      { label: 'order',      cls: 'bg-green-100 text-green-700' },
};

const ALL_SOURCES = ['ambassador', 'discount', 'newsletter', 'contact', 'order'];

const ALL_BRANDS: RealBrand[] = ['townies', 'goodkicks'];

// Sentinel for the one thing the global BrandSwitcher cannot express. Scoping
// to a brand hides untagged people entirely, which is how a mis-tag stays
// invisible — this chip is the way back to them.
const UNTAGGED = '__untagged__';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ContactsClient({
  initialContacts,
  brand,
}: {
  initialContacts: Contact[];
  brand: AdminBrand;
}) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  // Only the untagged chip lives here now — brand scoping is the global
  // switcher's job, and having both was why the switcher appeared to do nothing.
  const [showUntagged, setShowUntagged] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{
    name: string;
    email: string;
    notes: string;
    brands: RealBrand[];
  }>({ name: '', email: '', notes: '', brands: [] });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (sourceFilter && !c.sources.includes(sourceFilter)) return false;
      if (showUntagged && (c.brands ?? []).length > 0) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          c.email.toLowerCase().includes(q) ||
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.notes ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [contacts, search, sourceFilter, showUntagged]);

  const untaggedCount = useMemo(
    () => contacts.filter((c) => (c.brands ?? []).length === 0).length,
    [contacts],
  );

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => c.sources.forEach((s) => { counts[s] = (counts[s] ?? 0) + 1; }));
    return counts;
  }, [contacts]);

  function startEdit(c: Contact) {
    setEditingId(c.id);
    setEditFields({
      name: c.name ?? '',
      email: c.email,
      notes: c.notes ?? '',
      brands: (c.brands ?? []).filter((b): b is RealBrand => b === 'townies' || b === 'goodkicks'),
    });
  }

  function toggleEditBrand(b: RealBrand) {
    setEditFields((f) => ({
      ...f,
      brands: f.brands.includes(b) ? f.brands.filter((x) => x !== b) : [...f.brands, b],
    }));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFields.name.trim() || null,
          email: editFields.email.trim(),
          notes: editFields.notes.trim() || null,
          brands: editFields.brands,
        }),
      });
      if (res.ok) {
        setContacts((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: editFields.name.trim() || null,
                  email: editFields.email.trim(),
                  notes: editFields.notes.trim() || null,
                  brands: editFields.brands,
                }
              : c
          )
        );
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteContact(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Contacts</h1>
          <p className="text-white/50 text-sm mt-1">
            {contacts.length} total · {filtered.length} shown
          </p>
        </div>
        <SyncShopifyButton />
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 mb-4"
      />

      {/* Source filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSourceFilter(null)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            sourceFilter === null ? 'bg-white text-brand-ink' : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          all ({contacts.length})
        </button>
        {ALL_SOURCES.filter((s) => sourceCounts[s]).map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(sourceFilter === s ? null : s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              sourceFilter === s ? 'bg-white text-brand-ink' : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {s} ({sourceCounts[s]})
          </button>
        ))}
        {/* Brand scoping is the global BrandSwitcher's job. The one thing it
            cannot show is people with NO brand — and scoping to a brand hides
            them completely, so a mis-tag would never surface. Hence this chip,
            which is only meaningful while viewing All Brands. */}
        {brand === 'all' && untaggedCount > 0 && (
          <button
            onClick={() => setShowUntagged((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              showUntagged
                ? 'bg-white text-brand-ink'
                : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
            }`}
          >
            untagged ({untaggedCount})
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-white/40 text-sm">
          no contacts match.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => {
            const isEditing = editingId === contact.id;
            const isConfirmingDelete = confirmDeleteId === contact.id;

            return (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-brand-rule overflow-hidden"
              >
                {isEditing ? (
                  /* Edit mode */
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-brand-muted mb-1 block">Name</label>
                        <input
                          type="text"
                          value={editFields.name}
                          onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                          className="w-full text-sm bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-brand-muted mb-1 block">Email</label>
                        <input
                          type="email"
                          value={editFields.email}
                          onChange={(e) => setEditFields((f) => ({ ...f, email: e.target.value }))}
                          className="w-full text-sm bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-brand-muted mb-1 block">Notes</label>
                      <textarea
                        value={editFields.notes}
                        onChange={(e) => setEditFields((f) => ({ ...f, notes: e.target.value }))}
                        rows={2}
                        className="w-full text-sm bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink resize-none"
                        placeholder="Internal notes…"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brand-muted mb-1 block">Brands</label>
                      <div className="flex gap-4">
                        {ALL_BRANDS.map((b) => (
                          <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editFields.brands.includes(b)}
                              onChange={() => toggleEditBrand(b)}
                              className="accent-brand-ink"
                            />
                            {BRAND_LABELS[b]}
                          </label>
                        ))}
                      </div>
                      {/* The capture paths can only ever ADD a brand — this is
                          the only place a wrong one comes off. */}
                      <p className="text-[11px] text-brand-muted mt-1">
                        Unchecking both clears the tag.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(contact.id)}
                        disabled={saving}
                        className="bg-brand-ink text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        {saving ? 'saving…' : 'save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-brand-muted text-xs px-4 py-2 rounded-lg border border-brand-rule hover:border-brand-ink transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                ) : isConfirmingDelete ? (
                  /* Delete confirm */
                  <div className="px-5 py-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-brand-ink">Delete <strong>{contact.email}</strong>? This can&apos;t be undone.</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => deleteContact(contact.id)}
                        disabled={deletingId === contact.id}
                        className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 hover:bg-red-600 transition-colors"
                      >
                        {deletingId === contact.id ? 'deleting…' : 'delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-brand-muted text-xs px-3 py-1.5 rounded-lg border border-brand-rule hover:border-brand-ink transition-colors"
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink text-sm">
                        {contact.name ?? <span className="text-brand-muted italic font-normal">no name</span>}
                      </p>
                      <p className="text-brand-rust text-xs mt-0.5">{contact.email}</p>
                      {contact.notes && (
                        <p className="text-brand-muted text-xs mt-1 line-clamp-1">{contact.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(contact.sources ?? []).map((s) => {
                          const badge = SOURCE_BADGE[s] ?? { label: s, cls: 'bg-gray-100 text-gray-500' };
                          return (
                            <span key={s} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                          );
                        })}
                        {(contact.brands ?? []).map((b) => (
                          <BrandBadge key={b} brand={b as RealBrand} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-brand-muted">{fmtDate(contact.created_at)}</span>
                      <button
                        onClick={() => startEdit(contact)}
                        className="text-brand-muted hover:text-brand-ink transition-colors p-1.5 rounded-lg hover:bg-[#FAF8F3]"
                        aria-label="Edit contact"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(contact.id)}
                        className="text-brand-muted hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        aria-label="Delete contact"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
