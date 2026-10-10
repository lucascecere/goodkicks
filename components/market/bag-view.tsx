'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X } from 'lucide-react';
import { bagCount, removeFromBag, setQty, useBag } from '@/lib/shop/bag';
import { MARKET_BASE } from '@/lib/shop/paths';
import { dollars, FREE_SHIPPING_OVER_CENTS, shippingCents } from '@/lib/shop/money';

export function BagView() {
  const lines = useBag();
  const [delivery, setDelivery] = useState<'ship' | 'pickup'>('ship');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const sellers = useMemo(() => [...new Set(lines.map((l) => l.sellerId))], [lines]);
  // Pickup is at one business, so it's offered only when every hat comes from
  // one stall that does pickup.
  const canPickup = sellers.length === 1 && lines.every((l) => l.pickup);
  const mode = canPickup ? delivery : 'ship';

  const count = bagCount(lines);
  const subtotal = lines.reduce((n, l) => n + l.priceCents * l.qty, 0);
  const shipping = shippingCents(count, mode, subtotal);
  const toFree = FREE_SHIPPING_OVER_CENTS - subtotal;
  // Codes only discount Townies' own hats, so the box only shows when there is one.
  const codesApply = lines.some((l) => l.house);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery: mode,
          code: codesApply && code.trim() ? code.trim() : null,
          lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error || 'Checkout failed. Try again.');
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed. Try again.');
      setBusy(false);
    }
  }

  if (!lines.length) {
    return (
      <div className="border border-dashed border-rule px-6 py-14 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link href={MARKET_BASE} className="mt-4 inline-block font-label text-xs font-bold uppercase tracking-[0.16em] text-text underline underline-offset-4">
          Back to the market
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-rule border-y border-rule">
        {lines.map((l) => (
          <li key={l.productId} className="flex gap-4 py-4">
            <div className="relative h-20 w-20 shrink-0 bg-[#F1EEE8]">
              {l.image && <Image src={l.image} alt="" fill sizes="80px" className="object-contain p-1 mix-blend-multiply" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug text-text">{l.title}</p>
                  <Link href={`${MARKET_BASE}/${l.sellerSlug}`} className="text-sm text-muted underline-offset-4 hover:underline">
                    {l.sellerName}
                  </Link>
                </div>
                <button type="button" onClick={() => removeFromBag(l.productId)} aria-label={`Remove ${l.title}`} className="p-1 text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center border border-rule">
                  <button type="button" onClick={() => setQty(l.productId, l.qty - 1)} aria-label="One less" className="p-2 text-text disabled:opacity-30" disabled={l.qty <= 1}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                  <button type="button" onClick={() => setQty(l.productId, l.qty + 1)} aria-label="One more" className="p-2 text-text">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="tabular-nums text-text">{dollars(l.priceCents * l.qty)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <fieldset>
        <legend className="mb-3 font-label text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">How do you want it?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 border p-4 ${mode === 'ship' ? 'border-text' : 'border-rule'}`}>
            <input type="radio" name="delivery" className="mt-1" checked={mode === 'ship'} onChange={() => setDelivery('ship')} />
            <span>
              <span className="block font-semibold text-text">Ship it</span>
              <span className="text-sm text-muted">
                {shippingCents(count, 'ship', subtotal) ? dollars(shippingCents(count, 'ship', subtotal)) : 'Free'} · USPS, 3 to 7 business days
              </span>
              {toFree > 0 && <span className="mt-1 block text-xs text-muted">{dollars(toFree)} more for free shipping</span>}
            </span>
          </label>
          <label
            className={`flex items-start gap-3 border p-4 ${canPickup ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${mode === 'pickup' ? 'border-text' : 'border-rule'}`}
          >
            <input type="radio" name="delivery" className="mt-1" disabled={!canPickup} checked={mode === 'pickup'} onChange={() => setDelivery('pickup')} />
            <span>
              <span className="block font-semibold text-text">Pick it up free</span>
              <span className="text-sm text-muted">
                {canPickup ? `At ${lines[0].sellerName}. We email you when it's there.` : sellers.length > 1 ? 'Only when every hat is from one shop.' : "This shop doesn't do pickup."}
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {codesApply && (
        <div>
          <label htmlFor="code" className="mb-1.5 block font-label text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">
            Discount code
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            className="w-full border border-rule bg-white px-3 py-2.5 text-[0.9375rem] uppercase text-text focus:border-text focus:outline-none sm:w-64"
          />
          <p className="mt-1 text-xs text-muted">Applied at checkout. Works on Townies hats.</p>
        </div>
      )}

      <div className="space-y-2 border-t border-rule pt-6 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">{dollars(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>{mode === 'pickup' ? 'Pickup' : 'Shipping'}</span>
          <span className="tabular-nums">{shipping ? dollars(shipping) : 'Free'}</span>
        </div>
        <div className="flex justify-between text-muted">
          {/* No sales tax: hats are clothing under $175, exempt in Massachusetts. */}
          <span>Tax</span>
          <span>$0.00</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-text">
          <span>Total</span>
          <span className="tabular-nums">{dollars(subtotal + shipping)}</span>
        </div>
      </div>

      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <button
        type="button"
        onClick={checkout}
        disabled={busy}
        className="w-full bg-accent px-6 py-4 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Opening checkout…' : 'Check out'}
      </button>
      <p className="text-center text-xs text-muted">Secure checkout by Stripe. Market hats check out separately from the town hats in your cart.</p>
    </div>
  );
}
