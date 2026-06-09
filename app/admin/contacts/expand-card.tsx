'use client';

import { useState } from 'react';

interface Props {
  id: string;
  name: string;
  email: string;
  date: string;
  message: string;
}

export function ExpandCard({ id, name, email: initialEmail, date, message }: Props) {
  const [open, setOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const preview = message.length > 80 ? message.slice(0, 80) + '…' : message;

  async function saveEmail(e: React.MouseEvent) {
    e.stopPropagation();
    if (!editEmail.trim() || editEmail === initialEmail) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/update-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: id, email: editEmail.trim() }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full text-left bg-white rounded-xl border border-brand-rule overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 hover:bg-[#FAF7F2] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-brand-ink">{name}</p>
            <p className="text-brand-rust text-xs">{editEmail}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-brand-muted">{date}</span>
            <span className="text-brand-muted text-xs">{open ? '↑' : '↓'}</span>
          </div>
        </div>
        <p className={`text-brand-muted text-sm mt-3 leading-relaxed ${open ? '' : 'line-clamp-2'}`}>
          {open ? message : preview}
        </p>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-brand-rule space-y-2" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-brand-muted uppercase tracking-wide">Email</p>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={editEmail}
              onChange={(e) => { setEditEmail(e.target.value); setSaved(false); }}
              className="flex-1 text-sm text-brand-ink bg-[#FAF8F3] border border-brand-rule rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-ink"
            />
            <button
              onClick={saveEmail}
              disabled={saving || editEmail === initialEmail}
              className="shrink-0 bg-brand-ink text-white rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {saving ? 'saving…' : 'save'}
            </button>
            {saved && <span className="text-xs text-green-600">saved</span>}
          </div>
        </div>
      )}
    </div>
  );
}
