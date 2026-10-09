'use client';

import { useState } from 'react';
import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import { btn, field } from '@/components/admin/ui';

// Adding a rep who never filled out the public form — signed up in person or
// over DM. Everything downstream (code creation, welcome email, sales tracking)
// is the same as an approved application.

export type NewRep = Record<string, unknown> & { id: string };

export function AddRepForm({
  brand,
  onCreated,
  onClose,
}: {
  brand: AdminBrand;
  onCreated: (rep: NewRep) => void;
  onClose: () => void;
}) {
  // With "All Brands" selected there's no brand to infer, so make it explicit.
  const [repBrand, setRepBrand] = useState<RealBrand>(brand === 'goodkicks' ? 'goodkicks' : 'townies');
  const isTownies = repBrand === 'townies';

  const [form, setForm] = useState({
    name: '',
    email: '',
    instagram: '',
    town: '',
    school: '',
    age: '',
    notes: '',
  });
  const [hatDelivered, setHatDelivered] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErr('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr('');

    const ageNum = form.age ? parseInt(form.age, 10) : null;
    const res = await fetch('/api/admin/create-rep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: repBrand,
        name: form.name,
        email: form.email,
        instagram: form.instagram,
        town: form.town,
        school: form.school,
        hatPreference: isTownies ? form.town : '',
        hatDelivered,
        notes: form.notes,
        age: Number.isInteger(ageNum) ? ageNum : null,
      }),
    });
    setSaving(false);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(json.error ?? 'could not add this rep');
      return;
    }
    onCreated(json.rep as NewRep);
  }

  const inputCls = field;
  const labelCls = 'admin-eyebrow mb-1.5 block';

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-block text-2xl font-bold leading-tight text-town-cream">Add a rep</h2>
          <p className="mt-0.5 text-xs text-town-cream/50">
            For someone who never filled out the form.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-town-cream/50 transition-colors hover:text-town-cream"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {brand === 'all' && (
        <div>
          <label className={labelCls}>Brand</label>
          <div className="flex gap-2">
            {(['townies', 'goodkicks'] as RealBrand[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setRepBrand(b)}
                className={`flex-1 rounded-full border py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  repBrand === b
                    ? 'border-town-cream bg-town-cream text-town-navy'
                    : 'border-town-cream/15 text-town-cream/60 hover:text-town-cream'
                }`}
              >
                {b === 'townies' ? 'Townies' : 'Good Kicks'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Name *</label>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Alex Smith" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Age</label>
          <input
            type="number"
            min={13}
            max={100}
            value={form.age}
            onChange={(e) => set('age', e.target.value)}
            placeholder="optional"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Email *</label>
        <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="alex@email.com" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Instagram</label>
        <input
          value={form.instagram}
          onChange={(e) => set('instagram', e.target.value)}
          placeholder="@handle or profile URL"
          className={inputCls}
        />
      </div>

      {isTownies ? (
        <div>
          <label className={labelCls}>Town(s) *</label>
          <input
            required
            value={form.town}
            onChange={(e) => set('town', e.target.value)}
            placeholder="Milton, Weymouth"
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-town-cream/45">
            Separate with commas if they cover more than one — a page run by two people counts as
            one rep. Their code comes from their handle, not their town.
          </p>
        </div>
      ) : (
        <div>
          <label className={labelCls}>School / Group</label>
          <input value={form.school} onChange={(e) => set('school', e.target.value)} placeholder="Ohio State University" className={inputCls} />
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={hatDelivered}
          onChange={(e) => setHatDelivered(e.target.checked)}
          className="mt-0.5 shrink-0 accent-town-cream"
        />
        <span className="text-xs leading-relaxed text-town-cream">
          They already have their hat
          <span className="text-town-cream/50">
            {' '}— their welcome email will say so instead of promising one is on the way.
          </span>
        </span>
      </label>

      <div>
        <label className={labelCls}>Internal notes</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="how you met them, anything to remember"
          className={`${inputCls} resize-none`}
        />
      </div>

      {err && <p className="text-xs text-red-300">{err}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className={`${btn.primary} flex-1`}
        >
          {saving ? 'adding…' : 'add rep'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className={btn.secondary}
        >
          cancel
        </button>
      </div>
      <p className="text-center text-[11px] text-town-cream/45">
        Next step: set their rates and send the welcome email.
      </p>
    </form>
  );
}
