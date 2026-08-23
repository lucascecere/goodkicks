'use client';

import { currentBrand } from '@/components/brand/current-brand';

// Shared form furniture for the inquiry pages.
//
// Styled with the SEMANTIC tokens (text-text / text-muted / border-rule /
// bg-accent / font-heading) rather than town-*, because this kit is now rendered
// on Good Kicks pages too. globals.css redefines those tokens under
// [data-brand="goodkicks"], so one component renders correctly in both palettes;
// hardcoding town-* put a navy-and-forest Townies form on a Good Kicks page.
//
// Support, Request a Town and Wholesale used to be three tabs of one component.
// They are separate pages now — each is a different intent with its own
// audience, and a wholesale buyer should be able to land on a wholesale URL —
// so the styling lives here rather than being copied into each.

import type { ReactNode } from 'react';

export const fieldClass =
  'w-full bg-white border border-rule rounded-sm px-4 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent';
export const labelClass =
  'block text-xs uppercase tracking-[0.15em] text-muted mb-1.5';
export const errClass = 'text-red-600 text-xs mt-1';

export function Submitted({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center py-12 space-y-3">
      <p className="font-heading uppercase text-3xl text-text">{title}</p>
      <p className="text-muted mx-auto">{body}</p>
    </div>
  );
}

export function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="bg-accent text-white px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-accent/90 transition-colors disabled:opacity-50"
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
      {hint && !error ? <p className="text-muted/70 text-xs mt-1">{hint}</p> : null}
      {error ? <p className={errClass}>{error}</p> : null}
    </div>
  );
}

/**
 * Every form posts the same way, stamped with whichever brand is on screen.
 * Was hardcoded to Townies — which was true while these forms only existed on
 * the Townies site, and stops being true the moment Good Kicks gets its own
 * /support. currentBrand() reads at submit time, so it costs nothing here.
 */
export async function postContact(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, brand: currentBrand() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
