'use client';

import { useState } from 'react';

interface Props {
  name: string;
  email: string;
  date: string;
  message: string;
}

export function ExpandCard({ name, email, date, message }: Props) {
  const [open, setOpen] = useState(false);
  const preview = message.length > 80 ? message.slice(0, 80) + '…' : message;

  return (
    <button
      onClick={() => setOpen((v) => !v)}
      className="w-full text-left bg-white rounded-xl border border-brand-rule px-5 py-4 hover:border-brand-rust/30 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-brand-ink">{name}</p>
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-brand-rust text-xs hover:underline"
          >
            {email}
          </a>
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
  );
}
