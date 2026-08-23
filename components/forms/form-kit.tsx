'use client';

// Shared form furniture for the inquiry pages.
//
// Support, Request a Town and Wholesale used to be three tabs of one component.
// They are separate pages now — each is a different intent with its own
// audience, and a wholesale buyer should be able to land on a wholesale URL —
// so the styling lives here rather than being copied into each.

import type { ReactNode } from 'react';

export const fieldClass =
  'w-full bg-white border border-town-rule rounded-sm px-4 py-2.5 text-sm text-town-navy placeholder:text-town-stone focus:outline-none focus:ring-2 focus:ring-town-forest';
export const labelClass =
  'block text-xs uppercase tracking-[0.15em] text-town-muted mb-1.5';
export const errClass = 'text-red-600 text-xs mt-1';

export function Submitted({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-12 space-y-3">
      <p className="font-block uppercase text-3xl text-town-navy">{title}</p>
      <p className="text-town-muted mx-auto">{body}</p>
    </div>
  );
}

export function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="bg-town-forest text-white px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-forest/90 transition-colors disabled:opacity-50"
    >
      {submitting ? 'Sending…' : label}
    </button>
  );
}

/** Label + control + error, so no page hand-rolls the arrangement. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {hint && !error ? <p className="text-town-stone text-xs mt-1">{hint}</p> : null}
      {error ? <p className={errClass}>{error}</p> : null}
    </div>
  );
}

/** Every form posts the same way; brand is always Townies on this site. */
export async function postContact(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, brand: 'townies' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
