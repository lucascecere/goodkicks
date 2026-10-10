// The admin's building blocks.
//
// One small kit so every admin page reads the same: a page header, cards,
// stat tiles, badges and an empty state. The admin is Townies-branded: a navy
// ground with cream type, Rokkitt for titles (font-block) and Figtree for
// labels (font-label). Older pages written with white/opacity classes on a
// dark ground sit on the same navy without changes.
//
// No 'use client': these render on the server and inside client components.

import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
  back,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-6 sm:mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-town-cream/50 hover:text-town-cream"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="admin-eyebrow mb-2">{eyebrow}</p>}
          <h1 className="font-block text-3xl font-bold leading-none text-town-cream sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-town-cream/55">{description}</p>}
        </div>
        {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-town-cream/10 bg-town-cream/[0.04] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-town-cream/10 px-4 py-3 sm:px-5">
          {title && <h2 className="admin-eyebrow">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  href?: string;
}) {
  const inner = (
    <div className="h-full rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 transition-colors hover:border-town-cream/25 sm:p-5">
      <p className="admin-eyebrow mb-2">{label}</p>
      <p className="font-block text-3xl font-bold leading-none text-town-cream tabular-nums sm:text-4xl">{value}</p>
      {sub && <p className="mt-2 text-xs text-town-cream/45">{sub}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export type BadgeTone = 'neutral' | 'good' | 'warn' | 'bad' | 'info';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-town-cream/15 text-town-cream/70',
  good: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warn: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  bad: 'border-red-400/30 bg-red-400/10 text-red-300',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 font-label text-[10px] font-semibold uppercase tracking-[0.12em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-town-cream/15 px-6 py-12 text-center">
      <p className="font-block text-xl font-bold text-town-cream">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm text-town-cream/50">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Button looks as class strings, so links and buttons share them. */
export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-town-cream px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-town-navy transition-opacity hover:opacity-90 disabled:opacity-40',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-town-cream/20 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-town-cream transition-colors hover:border-town-cream/50 disabled:opacity-40',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-label text-xs font-semibold uppercase tracking-[0.14em] text-town-cream/60 transition-colors hover:text-town-cream',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-red-500 disabled:opacity-40',
};

/** Shared input look for admin forms. */
export const field =
  'w-full rounded-lg border border-town-cream/15 bg-town-navy/60 px-3 py-2.5 text-sm text-town-cream placeholder:text-town-cream/30 focus:border-town-cream/50 focus:outline-none';

/** A label + value row, used on detail pages. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-town-cream/[0.07] py-2.5 last:border-0">
      <span className="text-xs text-town-cream/45">{label}</span>
      <span className="text-right text-sm text-town-cream">{children}</span>
    </div>
  );
}
