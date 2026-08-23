'use client';

import { useState } from 'react';
import { accountTypesFor, FOLLOWER_RANGES, repFieldLabels } from '@/lib/reps/labels';

type Props = {
  appId: string;
  brand: 'townies' | 'goodkicks';
  initialData: {
    name: string | null;
    email: string | null;
    instagram: string | null;
    school: string | null;
    town: string | null;
    hat_preference: string | null;
    account_type: string | null;
    followers: string | null;
    colorway_preference: string | null;
    shipping_address: string | null;
    notes: string | null;
    age: number | null;
  };
};

export function AccountDetailsEditor({ appId, brand, initialData }: Props) {
  const isTownies = brand === 'townies';
  const labels = repFieldLabels(brand);
  const accountTypes = accountTypesFor(brand);

  const [fields, setFields] = useState({
    name: initialData.name ?? '',
    email: initialData.email ?? '',
    instagram: initialData.instagram ?? '',
    school: initialData.school ?? '',
    town: initialData.town ?? '',
    hat_preference: initialData.hat_preference ?? '',
    account_type: initialData.account_type ?? '',
    followers: initialData.followers ?? '',
    colorway_preference: initialData.colorway_preference ?? '',
    shipping_address: initialData.shipping_address ?? '',
    notes: initialData.notes ?? '',
    age: initialData.age != null ? String(initialData.age) : '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key: keyof typeof fields, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...fields,
        age: fields.age !== '' ? parseInt(fields.age, 10) : null,
      };
      const res = await fetch('/api/admin/update-ambassador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, ...payload }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full text-sm text-brand-ink bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink';
  const labelCls = 'text-xs text-brand-muted uppercase tracking-wide';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className={labelCls}>Name</p>
          <input className={inputCls} value={fields.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className={labelCls}>Email</p>
          <input className={inputCls} type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className={labelCls}>Instagram</p>
          <input className={inputCls} value={fields.instagram} onChange={(e) => set('instagram', e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className={labelCls}>{labels.place}</p>
          {isTownies ? (
            <input className={inputCls} value={fields.town} onChange={(e) => set('town', e.target.value)} />
          ) : (
            <input className={inputCls} value={fields.school} onChange={(e) => set('school', e.target.value)} />
          )}
        </div>
        <div className="space-y-1">
          <p className={labelCls}>Account Type</p>
          <select className={inputCls} value={fields.account_type} onChange={(e) => set('account_type', e.target.value)}>
            <option value="">Select type</option>
            {accountTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className={labelCls}>Followers</p>
          <select className={inputCls} value={fields.followers} onChange={(e) => set('followers', e.target.value)}>
            <option value="">Select range</option>
            {FOLLOWER_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className={labelCls}>Age {fields.age !== '' && parseInt(fields.age, 10) < 18 && <span className="text-amber-600 normal-case">(minor — credit only)</span>}</p>
          <input className={inputCls} type="number" min="13" max="100" value={fields.age} onChange={(e) => set('age', e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className={labelCls}>{labels.preference}</p>
          {isTownies ? (
            <input className={inputCls} value={fields.hat_preference} onChange={(e) => set('hat_preference', e.target.value)} />
          ) : (
            <input className={inputCls} value={fields.colorway_preference} onChange={(e) => set('colorway_preference', e.target.value)} />
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className={labelCls}>Shipping Address</p>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={fields.shipping_address}
          onChange={(e) => set('shipping_address', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <p className={labelCls}>Internal Notes</p>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          placeholder="only you see this"
          value={fields.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      {fields.instagram && (
        <a
          href={`https://instagram.com/${fields.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-rust hover:underline"
        >
          view Instagram profile →
        </a>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-ink text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'saving…' : 'save changes'}
        </button>
        {saved && <span className="text-xs text-green-600">saved</span>}
      </div>
    </div>
  );
}
