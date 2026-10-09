'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';

// The Hat & Sack offer as a pop-up on /shop only (Lucas, 10-09: no section up
// top, not a card in the grid). A card in the corner on desktop, a sheet at
// the bottom on phones, a few seconds after the page opens. Closing it keeps it
// away for a week. The Mass trivia pop-up skips /shop so the two never stack.
const KEY = 'townies_hatsack_popup_v1';
const DELAY_MS = 5000;
const SNOOZE_DAYS = 7;

export function HatSackPopup({ fromCents }: { fromCents: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(KEY) ?? 0);
      if (until > Date.now()) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(KEY, String(Date.now() + SNOOZE_DAYS * 864e5));
    } catch {}
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="The Hat & Sack bundle"
      className="fixed inset-x-3 bottom-3 z-50 animate-[hatsack-in_300ms_ease-out] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[360px]"
    >
      <style>{`@keyframes hatsack-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[role=dialog]{animation:none!important}}`}</style>
      <div className="relative overflow-hidden bg-band text-white shadow-2xl">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 p-2 text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4 p-5 pr-10">
          <div className="flex shrink-0 items-center gap-1">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#F1EEE8]">
              <Image src="/brand/product/mil-front15.jpg" alt="" fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />
            </div>
            <span className="font-block text-lg font-bold text-white/70">+</span>
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#F1EEE8]">
              <Image src="/brand/product/gk-sack-massachusetts.jpg" alt="" fill sizes="56px" className="object-contain p-2 mix-blend-multiply" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-label text-[0.625rem] font-bold uppercase tracking-[0.2em] text-white/70">The Hat &amp; Sack</p>
            <p className="mt-1 text-[0.9375rem] leading-snug">
              Any hat plus a Good Kicks foot bag, <span className="font-semibold">from {formatUsd(fromCents)} shipped.</span>
            </p>
          </div>
        </div>
        <Link
          href={HAT_SACK_PATH}
          onClick={close}
          className="block border-t border-white/20 py-3.5 text-center font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-white hover:text-band"
        >
          Build yours
        </Link>
      </div>
    </div>
  );
}
