'use client';

import { useState, useMemo } from 'react';
import { SyncShopifyButton } from './sync-button';
import { BrandBadge } from '@/components/admin/brand-badge';
import { BRAND_LABELS, type AdminBrand, type RealBrand } from '@/lib/admin/brand';
import { fmtDate } from '@/lib/admin/format';
import { Badge, EmptyState, PageHeader, btn, field, type BadgeTone } from '@/components/admin/ui';

export type Contact = {
  id: string;
  email: string;
  name: string | null;
  notes: string | null;
  sources: string[];
  brands: string[];
  created_at: string;
};

const SOURCE_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  ambassador: { label: 'ambassador', tone: 'warn' },
  discount:   { label: 'discount',   tone: 'info' },
  newsletter: { label: 'newsletter', tone: 'info' },
  contact:    { label: 'contact',    tone: 'neutral' },
  order:      { label: 'order',      tone: 'good' },
};

const ALL_SOURCES = ['ambassador', 'discount', 'newsletter', 'contact', 'order'];

const ALL_BRANDS: RealBrand[] = ['townies', 'goodkicks'];

// Sentinel for the one thing the global BrandSwitcher cannot express. Scoping
// to a brand hides untagged people entirely, which is how a mis-tag stays
// invisible — this chip is the way back to them.
const UNTAGGED = '__untagged__';

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

  const chip = (on: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
      on ? 'bg-town-cream text-town-navy' : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="People"
        title="Contacts"
        description={`${contacts.length} total · ${filtered.length} shown`}
        right={<SyncShopifyButton />}
      />

      {/* Search */}
      <input
        type="text"
        placeholder="search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${field} mb-4`}
      />

      {/* Source filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setSourceFilter(null)} className={chip(sourceFilter === null)}>
          all ({contacts.length})
        </button>
        {ALL_SOURCES.filter((s) => sourceCounts[s]).map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(sourceFilter === s ? null : s)}
            className={chip(sourceFilter === s)}
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
            className={
              showUntagged
                ? chip(true)
                : 'whitespace-nowrap rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300 transition-colors hover:bg-amber-400/20'
            }
          >
            untagged ({untaggedCount})
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="No contacts match" body="Try another filter or search." />
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => {
            const isEditing = editingId === contact.id;
            const isConfirmingDelete = confirmDeleteId === contact.id;

            return (
              <div
                key={contact.id}
                className="overflow-hidden rounded-xl border border-town-cream/10 bg-town-cream/[0.04]"
              >
                {isEditing ? (
                  /* Edit mode */
                  <div className="space-y-3 px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="admin-eyebrow mb-1.5 block">Name</label>
                        <input
                          type="text"
                          value={editFields.name}
                          onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                          className={field}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="admin-eyebrow mb-1.5 block">Email</label>
                        <input
                          type="email"
                          value={editFields.email}
                          onChange={(e) => setEditFields((f) => ({ ...f, email: e.target.value }))}
                          className={field}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="admin-eyebrow mb-1.5 block">Notes</label>
                      <textarea
                        value={editFields.notes}
                        onChange={(e) => setEditFields((f) => ({ ...f, notes: e.target.value }))}
                        rows={2}
                        className={`${field} resize-none`}
                        placeholder="Internal notes…"
                      />
                    </div>
                    <div>
                      <label className="admin-eyebrow mb-1.5 block">Brands</label>
                      <div className="flex gap-4">
                        {ALL_BRANDS.map((b) => (
                          <label key={b} className="flex cursor-pointer items-center gap-2 text-sm text-town-cream">
                            <input
                              type="checkbox"
                              checked={editFields.brands.includes(b)}
                              onChange={() => toggleEditBrand(b)}
                              className="accent-town-cream"
                            />
                            {BRAND_LABELS[b]}
                          </label>
                        ))}
                      </div>
                      {/* The capture paths can only ever ADD a brand — this is
                          the only place a wrong one comes off. */}
                      <p className="mt-1 text-[11px] text-town-cream/45">
                        Unchecking both clears the tag.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(contact.id)} disabled={saving} className={btn.primary}>
                        {saving ? 'saving…' : 'save'}
                      </button>
                      <button onClick={cancelEdit} className={btn.secondary}>
                        cancel
                      </button>
                    </div>
                  </div>
                ) : isConfirmingDelete ? (
                  /* Delete confirm */
                  <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="min-w-0 break-words text-sm text-town-cream">
                      Delete <strong>{contact.email}</strong>? This can&apos;t be undone.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => deleteContact(contact.id)}
                        disabled={deletingId === contact.id}
                        className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-red-600 disabled:opacity-40"
                      >
                        {deletingId === contact.id ? 'deleting…' : 'delete'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className={btn.secondary}>
                        cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-town-cream">
                        {contact.name ?? <span className="font-normal italic text-town-cream/45">no name</span>}
                      </p>
                      <p className="mt-0.5 break-all text-xs text-town-cream/60">{contact.email}</p>
                      {contact.notes && (
                        <p className="mt-1 line-clamp-1 text-xs text-town-cream/45">{contact.notes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(contact.sources ?? []).map((s) => {
                          const badge = SOURCE_BADGE[s] ?? { label: s, tone: 'neutral' as BadgeTone };
                          return (
                            <Badge key={s} tone={badge.tone}>
                              {badge.label}
                            </Badge>
                          );
                        })}
                        {(contact.brands ?? []).map((b) => (
                          <BrandBadge key={b} brand={b as RealBrand} />
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-xs text-town-cream/45">{fmtDate(contact.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(contact)}
                          className="rounded-lg p-1.5 text-town-cream/50 transition-colors hover:bg-town-cream/[0.08] hover:text-town-cream"
                          aria-label="Edit contact"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(contact.id)}
                          className="rounded-lg p-1.5 text-town-cream/50 transition-colors hover:bg-red-400/10 hover:text-red-300"
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
