'use client';

import { useEffect, useState } from 'react';

const PRODUCT_TITLE = 'Good Kicks Foot Bag';
const DEFAULT_COST = 4.5;

export default function SettingsPage() {
  const [cost, setCost] = useState<string>(DEFAULT_COST.toFixed(2));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/product-costs')
      .then((r) => r.json())
      .then((data: Array<{ product_title: string; unit_cost: number }>) => {
        const entry = Array.isArray(data) ? data.find((d) => d.product_title === PRODUCT_TITLE) : null;
        if (entry) setCost(entry.unit_cost.toFixed(2));
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(cost);
    if (isNaN(parsed) || parsed < 0) return;
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/product-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_title: PRODUCT_TITLE, unit_cost: parsed }),
    });
    setSaving(false);
    setMsg(res.ok ? 'saved' : 'error saving');
  }

  const exampleRevenue = 15;
  const exampleCost = parseFloat(cost) || DEFAULT_COST;
  const exampleProfit = Math.max(0, exampleRevenue - exampleCost);
  const exampleCommission8 = (exampleProfit * 0.08).toFixed(2);
  const exampleCommission12 = (exampleProfit * 0.12).toFixed(2);
  const exampleCommission20 = (exampleProfit * 0.2).toFixed(2);

  return (
    <div className="p-6 sm:p-8 max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-1">product cost used for profit-based commission</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-brand-rule overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-rule">
          <h2 className="text-sm font-medium text-brand-ink">Cost Per Sack</h2>
          <p className="text-xs text-brand-muted mt-0.5">
            The unit cost deducted from sale price before calculating ambassador commission.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-brand-ink font-medium flex-1">Good Kicks Foot Bag</label>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-brand-muted">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => { setCost(e.target.value); setMsg(''); }}
                className="w-24 text-sm text-brand-ink bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-ink text-white text-sm font-medium px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'saving…' : 'save'}
            </button>
            {msg && (
              <p className={`text-xs ${msg === 'saved' ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
            )}
          </div>
        </div>
      </form>

      {/* Live preview */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
        <p className="text-white text-sm font-medium">commission preview — $15 sale</p>
        <div className="space-y-1.5 text-xs text-white/50">
          <div className="flex justify-between">
            <span>revenue</span>
            <span className="text-white/70">${exampleRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>cost per sack</span>
            <span className="text-white/70">− ${exampleCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1">
            <span className="text-white/80 font-medium">profit</span>
            <span className="text-white font-medium">${exampleProfit.toFixed(2)}</span>
          </div>
        </div>
        <div className="space-y-1 text-xs pt-1 border-t border-white/10">
          <div className="flex justify-between text-white/50">
            <span>starter (8%)</span>
            <span className="text-white/70">${exampleCommission8} / sack</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>repping (12%)</span>
            <span className="text-white/70">${exampleCommission12} / sack</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>anchor (20%)</span>
            <span className="text-white/70">${exampleCommission20} / sack</span>
          </div>
        </div>
      </div>
    </div>
  );
}
