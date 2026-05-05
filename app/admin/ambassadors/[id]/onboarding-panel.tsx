'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface App {
  id: string;
  name: string;
  email: string;
  instagram: string;
  colorway_preference: string | null;
  approved: boolean;
  status: string | null;
  discount_code: string | null;
}

const TIERS = [
  { pct: 10, label: '10% — Starter' },
  { pct: 15, label: '15% — Starter+' },
  { pct: 20, label: '20% — Repping' },
  { pct: 25, label: '25% — Repping+' },
  { pct: 30, label: '30% — Anchor' },
];

function Step({ n, label, done }: { n: number; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        done ? 'bg-green-500 text-white' : 'bg-brand-rule text-brand-muted'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-sm ${done ? 'text-brand-muted line-through' : 'text-brand-ink font-medium'}`}>{label}</span>
    </div>
  );
}

export function OnboardingPanel({ app }: { app: App }) {
  const router = useRouter();
  const suggested = app.instagram.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '') + '15';
  const [code, setCode] = useState(app.discount_code ?? suggested);
  const [tierPct, setTierPct] = useState(15);
  const [step, setStep] = useState<'idle' | 'loading' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const isApproved = app.approved;
  const isRejected = app.status === 'rejected';

  async function handleApprove() {
    if (!code.trim()) { setErr('enter the discount code you created in Shopify first.'); return; }
    setStep('loading');
    setErr('');
    const res = await fetch('/api/admin/approve-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, discountCode: code.trim().toUpperCase(), tierPct }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setErr(json.error ?? 'something went wrong');
      setStep('error');
    }
  }

  async function handleReject() {
    setRejecting(true);
    const res = await fetch('/api/admin/reject-ambassador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setRejecting(false);
    }
  }

  if (isApproved) {
    return (
      <div className="bg-white rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Onboarding Status</h2>

        <div className="space-y-3">
          <Step n={1} label="Shopify discount code created" done />
          <Step n={2} label="Welcome email sent" done />
          <Step n={3} label="Ambassador onboarded" done />
        </div>

        <div className="border-t border-brand-rule pt-4 space-y-1">
          <p className="text-xs text-brand-muted uppercase tracking-wide">Discount Code</p>
          <p className="font-mono text-lg font-bold text-brand-ink">{app.discount_code ?? '—'}</p>
        </div>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-600">
          <span className="text-lg">✕</span>
          <p className="font-medium">Application rejected</p>
        </div>
        <p className="text-brand-muted text-sm mt-2">This application was rejected. No email was sent.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Onboarding Checklist</h2>

      <div className="space-y-3">
        <Step n={1} label="Create discount code in Shopify" />
        <Step n={2} label="Enter code + tier below" />
        <Step n={3} label="Send welcome email" />
      </div>

      <div className="border-t border-brand-rule pt-5 space-y-4">
        <div>
          <p className="text-xs text-brand-muted mb-1">Suggested code</p>
          <p className="font-mono text-sm font-bold text-brand-ink bg-brand-rule/30 px-3 py-2 rounded">{suggested}</p>
          <p className="text-[11px] text-brand-muted mt-1">Create this exact code in Shopify → Discounts before approving.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-brand-muted block mb-1">Discount code (from Shopify)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. JOHNDOE15"
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm font-mono text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
          </div>

          <div>
            <label className="text-xs text-brand-muted block mb-1">Commission tier</label>
            <select
              value={tierPct}
              onChange={(e) => setTierPct(Number(e.target.value))}
              className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            >
              {TIERS.map((t) => (
                <option key={t.pct} value={t.pct}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleApprove}
            disabled={step === 'loading'}
            className="flex-1 bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-50"
          >
            {step === 'loading' ? 'sending…' : 'approve & send welcome email'}
          </button>
          <button
            onClick={handleReject}
            disabled={rejecting}
            className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {rejecting ? '…' : 'reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
