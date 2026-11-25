'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { track } from '@/lib/track';
import { GIVEAWAY_POPUP_KEY, giveawayEligible, giveawayPopupPending } from '@/lib/townies/giveaway';

/**
 * Town hat giveaway popup (Dec 2026). While the giveaway is open it takes the
 * first-order offer's slot (WelcomeSlideIn stands down while this is pending),
 * so a visitor never gets two popups. One tap to /giveaway; on a town page it
 * preselects that town. Closing snoozes it a day; tapping through, a week.
 */
const SNOOZE_DAYS = { dismissed: 1, clicked: 7 } as const;
const BLOCKED = ['/admin', '/checkout', '/cart', '/goodkicks', '/stick', '/local', '/hat-and-sack', '/wholesale', '/custom-hats', '/unsubscribed', '/giveaway'];
const PRODUCT_DELAY_MS = 10_000;
const PAGE_DELAY_MS = 4_000;
const PAGE_SCROLL = 0.25;

function snooze(reason: keyof typeof SNOOZE_DAYS) {
  try {
    localStorage.setItem(GIVEAWAY_POPUP_KEY, JSON.stringify({ until: Date.now() + SNOOZE_DAYS[reason] * 864e5, reason }));
  } catch {}
}

function titleCase(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function GiveawayPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Not on the homepage: its hero already is the giveaway.
    if (pathname === '/' || BLOCKED.some((p) => pathname.startsWith(p))) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('giveaway') === '0') return snooze('dismissed');
    const force = params.get('giveaway') === '1';
    if (!force && !giveawayPopupPending()) return;
    const product = pathname.startsWith('/products/');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setOpen(true);
      try { sessionStorage.setItem('townies_giveaway_seen', '1'); } catch {}
      track('giveaway_popup_view', { path: pathname });
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + h.clientHeight) / h.scrollHeight >= PAGE_SCROLL) show();
    };
    timer = setTimeout(show, force ? 1200 : product ? PRODUCT_DELAY_MS : PAGE_DELAY_MS);
    if (!product && !force) window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
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
    snooze('dismissed');
  }

  if (!open) return null;

  // On /towns/<slug>, point straight at that town's entry.
  const m = pathname.match(/^\/towns\/([a-z0-9-]+)/);
  const slug = m && giveawayEligible(m[1]) ? m[1] : null;
  const href = `/giveaway?${slug ? `town=${slug}&` : ''}utm_source=popup`;
  const label = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60';
  const primary = 'font-label inline-block bg-text px-5 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button aria-label="Close" onClick={close} className="absolute inset-0 animate-[fade-in_.3s_ease-out_both] bg-[#0D1B2A]/60 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Giveaway"
        className="relative w-full max-w-[440px] animate-[pop-in_.35s_ease-out_both] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(13,27,42,0.6)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/scene/giveaway-norwood-wide.jpg" alt="The Norwood hat on a wrapped gift box" className="block w-full h-auto" width={920} height={607} />
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-black/35 p-1 text-white hover:bg-black/55">
          <X size={20} />
        </button>
        <div className="p-6 sm:p-7">
          <p className={label}>Giveaway · ends Dec 6</p>
          <p className="display mt-2 text-[2rem] leading-[1.05] text-text">
            {slug ? `Win the ${titleCase(slug)} hat.` : 'Win your town’s hat.'}
          </p>
          <p className="mt-2 text-[0.9375rem] text-text/70">
            One free hat for every town. Pick yours and enter in ten seconds. Winners picked Monday, Dec 7.
          </p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <a
              href={href}
              className={primary}
              onClick={() => {
                snooze('clicked');
                track('giveaway_popup_click', { path: pathname });
              }}
            >
              Enter the giveaway
            </a>
            <button type="button" onClick={close} className="shrink-0 text-[0.8125rem] text-text/55 underline underline-offset-4 hover:text-text">
              No thanks
            </button>
          </div>
          <p className="mt-4 text-[0.6875rem] text-text/45">No purchase necessary. Not sponsored by Instagram.</p>
        </div>
      </div>
    </div>
  );
}
