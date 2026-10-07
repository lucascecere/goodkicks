'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Replaces the rotary popup (2026-10). A small card that rises from the
 * bottom corner on the visitor's second page or at 60% scroll: no timer, no
 * exit-intent, no wheel. The offer is the fixed WELCOME prize, minted through
 * the same /api/spin/claim path as the rotary.
 */
const KEY = 'townies_welcome_v1';
const SNOOZE_DAYS = { dismissed: 14, claimed: 365 } as const;
const VIEWS = 'townies_welcome_views';
const BLOCKED = ['/admin', '/checkout', '/cart', '/goodkicks', '/stick'];

function snoozedUntil(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw).until as number) ?? 0 : 0;
  } catch {
    return 0;
  }
}
function snooze(reason: keyof typeof SNOOZE_DAYS) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + SNOOZE_DAYS[reason] * 864e5, reason }));
  } catch {}
}

export function WelcomeSlideIn() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ code: string; emailed: boolean; alreadyClaimed: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (BLOCKED.some((p) => pathname.startsWith(p))) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === '0') return snooze('dismissed');
    if (params.get('welcome') !== '1' && snoozedUntil() > Date.now()) return;

    let views = 0;
    try {
      views = Number(sessionStorage.getItem(VIEWS) ?? 0) + 1;
      sessionStorage.setItem(VIEWS, String(views));
    } catch {}
    if (params.get('welcome') === '1' || views >= 2) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + h.clientHeight) / h.scrollHeight >= 0.6) {
        setOpen(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  function close() {
    setOpen(false);
    if (state !== 'done') snooze('dismissed');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    setError('');
    try {
      const t = await fetch('/api/spin/welcome', { method: 'POST' }).then((r) => r.json());
      if (!t.token) throw new Error(t.error ?? 'Try again in a minute.');
      const res = await fetch('/api/spin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t.token, email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Try again in a minute.');
      setResult({ code: body.code, emailed: body.emailed, alreadyClaimed: body.alreadyClaimed });
      setState('done');
      snooze('claimed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again in a minute.');
      setState('error');
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="New towns first"
      className="fixed inset-x-3 bottom-3 z-[60] animate-[slide-in_.4s_ease-out_both] border border-rule bg-white p-5 shadow-[0_18px_50px_-20px_rgba(13,27,42,0.45)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px] sm:p-6"
    >
      <button onClick={close} aria-label="Close" className="absolute right-3 top-3 p-1 text-text/50 hover:text-text">
        <X size={18} />
      </button>
      {state === 'done' && result ? (
        <div>
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">
            {result.alreadyClaimed ? 'Already yours' : 'Welcome in'}
          </p>
          <p className="display mt-2 text-[1.625rem] text-text">Your code: {result.code}</p>
          <p className="mt-2 text-[0.9375rem] text-text/70">
            {result.emailed ? 'We sent it to your inbox too. ' : ''}10% off your first order, applied at checkout.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">New towns first</p>
          <p className="display mt-2 pr-6 text-[1.5rem] leading-tight text-text">
            One email when a town drops, and 10% off your first order.
          </p>
          <div className="mt-4 flex gap-2">
            <label htmlFor="welcome-email" className="sr-only">Email</label>
            <input
              id="welcome-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 border border-text/25 px-3 py-3 text-[1rem] text-text placeholder:text-text/40 focus:border-text focus:outline-none"
            />
            <button
              disabled={state === 'busy'}
              className="font-label bg-text px-5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black disabled:opacity-60"
            >
              {state === 'busy' ? '…' : 'Send it'}
            </button>
          </div>
          {error && <p className="mt-2 text-[0.8125rem] text-red-700">{error}</p>}
          <button type="button" onClick={close} className="mt-3 text-[0.8125rem] text-text/55 underline underline-offset-4 hover:text-text">
            Not now
          </button>
        </form>
      )}
    </div>
  );
}
