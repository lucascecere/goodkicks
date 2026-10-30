'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { OFFER_POPUP_KEY, saveOffer } from '@/lib/townies/welcome-offer';

/**
 * First-order offer (Lucas, 2026-10-28): $5 off plus free shipping, shown
 * almost every visit until it's claimed. Replaced Mass trivia. One step:
 * email in, code out. The token comes from /api/welcome and is claimed through
 * /api/spin/claim (Shopify-first minting, one code per email, returning
 * customers turned away). The codes are saved so the bag applies them.
 */
type Snooze = { until: number; reason: 'dismissed' | 'claimed' };
/** Closing it only buys a day: Lucas wants it up almost every visit. */
const SNOOZE_DAYS = { dismissed: 1, claimed: 365 } as const;
/** Someone who already claimed a trivia code isn't asked again. */
const LEGACY_KEY = 'townies_welcome_v1';
// /wholesale and /custom-hats are for businesses (shop outreach lands there), not first-hat shoppers.
const BLOCKED = ['/admin', '/checkout', '/cart', '/goodkicks', '/stick', '/local', '/hat-and-sack', '/wholesale', '/custom-hats', '/unsubscribed'];
/** Product pages wait longer and skip the scroll trigger, so the buy box gets a look first. */
const PRODUCT_DELAY_MS = 10_000;
const PAGE_DELAY_MS = 5_000;
const PAGE_SCROLL = 0.3;

function snoozedUntil(): number {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && JSON.parse(legacy).reason === 'claimed') return Infinity;
    const raw = localStorage.getItem(OFFER_POPUP_KEY);
    return raw ? ((JSON.parse(raw) as Snooze).until ?? 0) : 0;
  } catch {
    return 0;
  }
}
function snooze(reason: Snooze['reason']) {
  try {
    localStorage.setItem(OFFER_POPUP_KEY, JSON.stringify({ until: Date.now() + SNOOZE_DAYS[reason] * 864e5, reason }));
  } catch {}
}

export function WelcomeSlideIn() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; shipCode: string | null; emailed: boolean; alreadyClaimed: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (BLOCKED.some((p) => pathname.startsWith(p))) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === '0') return snooze('dismissed');
    if (params.get('welcome') !== '1' && snoozedUntil() > Date.now()) return;
    if (params.get('welcome') === '1') {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
    const product = pathname.startsWith('/products/');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setOpen(true);
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + h.clientHeight) / h.scrollHeight >= PAGE_SCROLL) show();
    };
    timer = setTimeout(show, product ? PRODUCT_DELAY_MS : PAGE_DELAY_MS);
    if (!product) window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  function close() {
    setOpen(false);
    if (!result) snooze('dismissed');
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const start = await fetch('/api/welcome', { method: 'POST' });
      const { token, error: startError } = await start.json();
      if (!start.ok) throw new Error(startError ?? 'Try again in a minute.');
      const res = await fetch('/api/spin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const body = await res.json();
      if (!res.ok) {
        // A returning customer isn't an error worth retrying; stop asking.
        if (body.code === 'returning') snooze('claimed');
        throw new Error(body.error ?? 'Try again in a minute.');
      }
      saveOffer({ codes: [body.code, body.shipCode].filter(Boolean), expiresAt: body.expiresAt ?? null });
      setResult({ code: body.code, shipCode: body.shipCode ?? null, emailed: body.emailed, alreadyClaimed: body.alreadyClaimed });
      snooze('claimed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again in a minute.');
    }
    setBusy(false);
  }

  // Escape closes, and the page behind doesn't scroll while the pop-up is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const label = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60';
  const primary = 'font-label bg-text px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black disabled:opacity-60';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0 animate-[fade-in_.3s_ease-out_both] bg-[#0D1B2A]/60 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="First-order offer"
        className="relative w-full max-w-[460px] animate-[pop-in_.35s_ease-out_both] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(13,27,42,0.6)]"
      >
        <div className="bg-[#0D1B2A] px-6 py-5 text-center sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logos/townies-script-natural.svg" alt="Townies" className="mx-auto h-10 w-auto" />
        </div>
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 p-1 text-white/70 hover:text-white">
          <X size={20} />
        </button>
        <div className="p-6 sm:p-8">

      {!result && (
        <form onSubmit={claim}>
          <p className={label}>First order</p>
          <p className="display mt-2 text-[2rem] leading-[1.05] text-text">$5 off and free shipping.</p>
          <p className="mt-2 text-[0.9375rem] text-text/70">On your first Townies hat. Drop your email and the code is yours.</p>
          <div className="mt-4 flex gap-2">
            <label htmlFor="offer-email" className="sr-only">Email</label>
            <input
              id="offer-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 border border-text/25 px-3 py-3 text-[1rem] text-text placeholder:text-text/40 focus:border-text focus:outline-none"
            />
            <button disabled={busy} className={primary}>{busy ? '…' : 'Get it'}</button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[0.75rem] text-text/50">One code per person. You’ll also hear when a new town drops.</p>
            <button type="button" onClick={close} className="shrink-0 text-[0.8125rem] text-text/55 underline underline-offset-4 hover:text-text">No thanks</button>
          </div>
        </form>
      )}

      {result && (
        <div>
          <p className={label}>{result.alreadyClaimed ? 'Already yours' : 'You’re in'}</p>
          <p className="mt-2 text-[0.8125rem] text-text/60">Your code</p>
          <p className="display whitespace-nowrap text-[1.75rem] text-text">{result.code}</p>
          {result.shipCode && <p className="mt-1 text-[0.9375rem] text-text/70">Free shipping: {result.shipCode}</p>}
          <p className="mt-2 text-[0.9375rem] text-text/70">
            {result.shipCode ? 'Both go on at checkout automatically. ' : 'Enter it at checkout. '}
            {result.emailed ? 'We sent them to your inbox too.' : ''}
          </p>
          <button onClick={() => setOpen(false)} className={`${primary} mt-4`}>Shop hats</button>
        </div>
      )}

      {error && <p className="mt-2 text-[0.8125rem] text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
