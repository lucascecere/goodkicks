'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

const CARD = 'rounded-lg border border-white/10 bg-white/[0.03] p-5';
const BTN = 'rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors';

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
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
          <span className="text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
          <span className="rounded bg-white/10 px-2 py-0.5 uppercase tracking-wider">{r.brand}</span>
          {r.verified ? (
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 uppercase tracking-wider text-emerald-300">
              Verified order
            </span>
          ) : (
            <span className="rounded bg-white/10 px-2 py-0.5 uppercase tracking-wider">
              Unverified · open form
            </span>
          )}
          {r.product_title && <span>{r.product_title}</span>}
          <span className="ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
        </div>

        {editable ? (
          <>
            <textarea
              value={field(r, 'quote')}
              onChange={(e) => setField(r, 'quote', e.target.value)}
              rows={4}
              className="w-full rounded border border-white/15 bg-black/30 p-3 text-sm text-white"
            />
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                value={field(r, 'name')}
                onChange={(e) => setField(r, 'name', e.target.value)}
                placeholder="Name"
                className="rounded border border-white/15 bg-black/30 p-2 text-sm text-white"
              />
              <input
                value={field(r, 'town')}
                onChange={(e) => setField(r, 'town', e.target.value)}
                placeholder="Town"
                className="rounded border border-white/15 bg-black/30 p-2 text-sm text-white"
              />
            </div>
            {/* Trim a surname to an initial, fix a typo, cut a rambling third
                paragraph. Not for changing what somebody meant. */}
            <p className="mt-2 text-[11px] text-white/40">
              Light edits only — trim a surname, fix a typo. Don't rewrite it.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-white/90">“{r.quote}”</p>
            <p className="mt-2 text-xs text-white/50">
              {r.name}
              {r.town ? ` · ${r.town}` : ''}
            </p>
          </>
        )}

        {r.email && <p className="mt-2 text-[11px] text-white/30">{r.email}</p>}

        <div className="mt-4 flex gap-2">
          {r.status !== 'approved' && (
            <button
              disabled={busy === r.id}
              onClick={() => act(r, 'approve')}
              className={`${BTN} bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-50`}
            >
              {busy === r.id ? '…' : 'Approve'}
            </button>
          )}
          {r.status !== 'rejected' && (
            <button
              disabled={busy === r.id}
              onClick={() => act(r, 'reject')}
              className={`${BTN} bg-white/10 text-white hover:bg-white/20 disabled:opacity-50`}
            >
              {r.status === 'approved' ? 'Unpublish' : 'Reject'}
            </button>
          )}
          <button
            disabled={busy === r.id}
            onClick={() => act(r, 'delete')}
            className={`${BTN} ml-auto text-red-400 hover:bg-red-500/10 disabled:opacity-50`}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Reviews</h1>
        <p className="mt-1 text-sm text-white/50">
          Customers write these at <code className="text-white/70">/review</code>. Nothing reaches
          the homepage until you approve it.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          Waiting on you ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-white/40">Nothing in the queue.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <Row key={r.id} r={r} editable />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
          Live on the site ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-white/40">
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
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
