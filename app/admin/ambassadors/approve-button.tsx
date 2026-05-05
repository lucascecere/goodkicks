'use client';

import { useState } from 'react';

interface Props {
  applicationId: string;
  instagram: string;
}

export function ApproveButton({ applicationId, instagram }: Props) {
  const [open, setOpen] = useState(false);
  const suggested = instagram.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '') + '15';
  const [code, setCode] = useState(suggested);
  const [tierPct, setTierPct] = useState(15);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function handleApprove() {
    setStatus('loading');
    setErr('');
    const res = await fetch('/api/admin/approve-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, discountCode: code, tierPct }),
    });
    if (res.ok) {
      setStatus('success');
    } else {
      const json = await res.json().catch(() => ({}));
      setErr(json.error ?? 'something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">approved ✓</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-rust text-white hover:bg-brand-rust/90 transition-colors"
      >
        approve
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex gap-2 items-center">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DISCOUNT CODE"
          className="border border-brand-rule rounded px-2 py-1 text-xs font-mono text-brand-ink w-36 focus:outline-none focus:ring-1 focus:ring-brand-rust/40"
        />
        <select
          value={tierPct}
          onChange={(e) => setTierPct(Number(e.target.value))}
          className="border border-brand-rule rounded px-2 py-1 text-xs text-brand-ink focus:outline-none"
        >
          <option value={10}>10%</option>
          <option value={15}>15%</option>
          <option value={20}>20%</option>
          <option value={25}>25%</option>
        </select>
      </div>
      <p className="text-[10px] text-brand-muted">create this code in Shopify first, then send.</p>
      {err && <p className="text-[10px] text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={!code || status === 'loading'}
          className="text-xs font-medium px-3 py-1.5 rounded-full bg-brand-rust text-white hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'sending…' : 'send welcome email'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-brand-muted hover:text-brand-ink transition-colors"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
