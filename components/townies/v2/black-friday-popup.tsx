'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { track } from '@/lib/track';
import { BLACK_FRIDAY, blackFridayOn } from '@/lib/townies/black-friday';

/**
 * Black Friday weekend popup (Nov 27 to 29, 2026). The ONLY popup on the site
 * while the sale runs (SiteWrapper mounts it instead of the giveaway / first-
 * order popups). Not on the homepage, whose hero already is the sale. On a hat
 * or town page it points at that page's hats; elsewhere at the shop. Closing it
 * snoozes it for a day.
 */
const KEY = 'townies_bf_popup_2026';
const BLOCKED = ['/admin', '/checkout', '/cart', '/goodkicks', '/stick', '/local', '/hat-and-sack', '/wholesale', '/custom-hats', '/unsubscribed'];
const PRODUCT_DELAY_MS = 6_000;
const PAGE_DELAY_MS = 3_500;

function snoozed(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    return !!raw && (JSON.parse(raw).until ?? 0) > Date.now();
  } catch {
    return false;
  }
}
function snooze(days: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + days * 864e5 }));
  } catch {}
}

export function BlackFridayPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!blackFridayOn()) return;
    if (pathname === '/' || BLOCKED.some((p) => pathname.startsWith(p))) return;
    const params = new URLSearchParams(window.location.search);
    const force = params.get('bf') === '1';
    if (!force && snoozed()) return;
    const t = setTimeout(() => {
      setOpen(true);
      track('bf_popup_view', { path: pathname });
    }, force ? 1000 : pathname.startsWith('/products/') ? PRODUCT_DELAY_MS : PAGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

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

  function close() {
    setOpen(false);
    snooze(1);
  }

  if (!open) return null;

  // On a hat page the shopper is already where they need to be: just close.
  const onProduct = pathname.startsWith('/products/');
  const onTown = pathname.startsWith('/towns/') || pathname.startsWith('/shop') || pathname.startsWith('/gifts');
  const primary = 'font-label inline-block bg-text px-5 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0 animate-[fade-in_.3s_ease-out_both] bg-[#0D1B2A]/60 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Black Friday sale"
        className="relative w-full max-w-[440px] animate-[pop-in_.35s_ease-out_both] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(13,27,42,0.6)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/scene/bf-needham-popup.jpg" alt="The Needham hat under a spotlight" className="block w-full h-auto" width={920} height={613} />
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-black/40 p-1 text-white hover:bg-black/60">
          <X size={20} />
        </button>
        <div className="p-6 sm:p-7">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#B3261E]">
            Black Friday · ends {BLACK_FRIDAY.endsLabel}
          </p>
          <p className="display mt-2 text-[2.125rem] leading-[1.02] uppercase! tracking-[0.01em]! text-text">$10 off in-stock hats.</p>
          <p className="mt-2 text-[0.9375rem] text-text/70">
            In-stock hats are $19.99 this weekend only. No code needed, it comes off at checkout.
          </p>
          <div className="mt-5 flex items-center justify-between gap-4">
            {onProduct || onTown ? (
              <button
                type="button"
                className={primary}
                onClick={() => {
                  snooze(1);
                  setOpen(false);
                  track('bf_popup_click', { path: pathname });
                }}
              >
                {onProduct ? 'Get this hat' : 'Shop the sale'}
              </button>
            ) : (
              <a
                href="/shop?utm_source=popup&utm_campaign=black-friday"
                className={primary}
                onClick={() => {
                  snooze(1);
                  track('bf_popup_click', { path: pathname });
                }}
              >
                Shop the sale
              </a>
            )}
            <button type="button" onClick={close} className="shrink-0 text-[0.8125rem] text-text/55 underline underline-offset-4 hover:text-text">
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
