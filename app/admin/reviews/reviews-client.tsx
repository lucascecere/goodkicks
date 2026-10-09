'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, EmptyState, PageHeader, btn, field as fieldCls } from '@/components/admin/ui';

export type AdminReview = {
  id: string;
  created_at: string;
  brand: string;
  rating: number;
  quote: string;
  name: string;
  town: string | null;
  product_title: string | null;
  email: string | null;
  shopify_order_id: string | null;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  source: 'form' | 'request';
};

const CARD = 'rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-5';

export function ReviewsClient({ initial }: { initial: AdminReview[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { name: string; town: string; quote: string }>>({});

  const pending = initial.filter((r) => r.status === 'pending');
  const approved = initial.filter((r) => r.status === 'approved');
  const rejected = initial.filter((r) => r.status === 'rejected');

  async function act(r: AdminReview, action: 'approve' | 'reject' | 'delete') {
    if (action === 'delete' && !confirm('Delete this review permanently?')) return;
    setBusy(r.id);
    const edit = edits[r.id];
    await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: r.id, action, ...(action === 'approve' ? edit : {}) }),
    });
    setBusy(null);
    router.refresh();
  }

  function field(r: AdminReview, key: 'name' | 'town' | 'quote') {
    return (
      edits[r.id]?.[key] ??
      (key === 'town' ? (r.town ?? '') : key === 'name' ? r.name : r.quote)
    );
  }

  function setField(r: AdminReview, key: 'name' | 'town' | 'quote', value: string) {
    setEdits((prev) => ({
      ...prev,
      [r.id]: {
        name: prev[r.id]?.name ?? r.name,
        town: prev[r.id]?.town ?? r.town ?? '',
        quote: prev[r.id]?.quote ?? r.quote,
        [key]: value,
      },
    }));
  }

  function Row({ r, editable }: { r: AdminReview; editable: boolean }) {
    return (
      <div className={CARD}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-town-cream/50">
          <span className="text-amber-300">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          <Badge>{r.brand}</Badge>
          {r.verified ? (
            <Badge tone="good">Verified order</Badge>
          ) : (
            <Badge>Unverified · open form</Badge>
          )}
          {r.product_title && <span>{r.product_title}</span>}
          <span className="ml-auto">{new Date(r.created_at).toLocaleDateString('en-US', { timeZone: 'America/New_York' })}</span>
        </div>

        {editable ? (
          <>
            <textarea
              value={field(r, 'quote')}
              onChange={(e) => setField(r, 'quote', e.target.value)}
              rows={4}
              className={fieldCls}
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={field(r, 'name')}
                onChange={(e) => setField(r, 'name', e.target.value)}
                placeholder="Name"
                className={fieldCls}
              />
              <input
                value={field(r, 'town')}
                onChange={(e) => setField(r, 'town', e.target.value)}
                placeholder="Town"
                className={fieldCls}
              />
            </div>
            {/* Trim a surname to an initial, fix a typo, cut a rambling third
                paragraph. Not for changing what somebody meant. */}
            <p className="mt-2 text-[11px] text-town-cream/40">
              Light edits only — trim a surname, fix a typo. Don't rewrite it.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-town-cream/90">“{r.quote}”</p>
            <p className="mt-2 text-xs text-town-cream/50">
              {r.name}
              {r.town ? ` · ${r.town}` : ''}
            </p>
          </>
        )}

        {r.email && <p className="mt-2 break-all text-[11px] text-town-cream/35">{r.email}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {r.status !== 'approved' && (
            <button
              disabled={busy === r.id}
              onClick={() => act(r, 'approve')}
              className={btn.primary}
            >
              {busy === r.id ? '…' : 'Approve'}
            </button>
          )}
          {r.status !== 'rejected' && (
            <button
              disabled={busy === r.id}
              onClick={() => act(r, 'reject')}
              className={btn.secondary}
            >
              {r.status === 'approved' ? 'Unpublish' : 'Reject'}
            </button>
          )}
          <button
            disabled={busy === r.id}
            onClick={() => act(r, 'delete')}
            className={`${btn.ghost} ml-auto text-red-300/80 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50`}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Marketing"
        title="Reviews"
        description={
          <>
            Customers write these at <code className="text-town-cream/75">/review</code>. Nothing reaches
            the homepage until you approve it.
          </>
        }
      />

      <section>
        <h2 className="admin-eyebrow mb-3">
          Waiting on you ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="Nothing in the queue." />
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <Row key={r.id} r={r} editable />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="admin-eyebrow mb-3">
          Live on the site ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-town-cream/40">
            None yet — the homepage section stays hidden until there is at least one.
          </p>
        ) : (
          <div className="space-y-4">
            {approved.map((r) => (
              <Row key={r.id} r={r} editable={false} />
            ))}
          </div>
        )}
      </section>

      {rejected.length > 0 && (
        <section>
          <h2 className="admin-eyebrow mb-3">
            Rejected ({rejected.length})
          </h2>
          <div className="space-y-4">
            {rejected.map((r) => (
              <Row key={r.id} r={r} editable={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
