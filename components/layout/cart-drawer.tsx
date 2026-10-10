'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { LogoImg } from '@/components/brand/brand-logo';
import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import type { BrandConfig } from '@/lib/brand/brands';
import { PREORDER_SHIP_NOTE } from '@/lib/townies/preorder';

/**
 * "You're $12 from free shipping" — the single most reliable nudge a cart
 * drawer can carry, and the threshold is already promised on the value band
 * and the product page. Reads the brand's threshold so Good Kicks, which
 * ships free outright, never shows it.
 */
function FreeShippingBar({ subtotalCents, thresholdCents }: { subtotalCents: number; thresholdCents: number }) {
  const remaining = Math.max(0, thresholdCents - subtotalCents);
  const pct = Math.min(100, Math.round((subtotalCents / thresholdCents) * 100));
  return (
    <div className="space-y-1.5" aria-live="polite">
      <p className="text-xs text-muted">
        {remaining === 0 ? (
          <span className="font-semibold text-text">Free shipping unlocked.</span>
        ) : (
          <>
            You&apos;re <span className="font-semibold text-text">{formatCents(remaining)}</span> from free shipping.
          </>
        )}
      </p>
      <div className="h-1.5 w-full rounded-full bg-rule overflow-hidden">
        <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export function CartDrawer({ brand }: { brand: BrandConfig }) {
  const { items, cartOpen, closeCart, subtotalCents, removeItem, updateQuantity } = useCart();
  const hasPreorder = items.some((i) =>
    i.customAttributes?.some((a) => a.value.toLowerCase().includes('pre-order')),
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | boolean>(false);
  const [promo, setPromo] = useState("");
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Townies hats can't be stepped past the shelf: live on-hand counts for the
  // Townies lines (Good Kicks unchanged), fetched whenever the drawer opens or
  // the lines change. null = no cap (pre-orders, untracked variants).
  const [stockCap, setStockCap] = useState<Record<string, number | null>>({});
  const townieIds = items
    .filter((i) => i.customAttributes?.some((a) => a.key === '_brand' && a.value === 'townies'))
    .filter((i) => !i.customAttributes?.some((a) => a.key === 'Fulfillment' && /pre-order/i.test(a.value)))
    .map((i) => i.variantId);
  const idsKey = [...new Set(townieIds)].sort().join(',');
  useEffect(() => {
    if (!cartOpen || !idsKey) return;
    let live = true;
    fetch(`/api/stock?ids=${encodeURIComponent(idsKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && j?.stock && setStockCap(j.stock))
      .catch(() => {});
    return () => { live = false; };
  }, [cartOpen, idsKey]);
  const capFor = (variantId: string): number | undefined => {
    const n = townieIds.includes(variantId) ? stockCap[variantId] : null;
    return typeof n === 'number' && n > 0 ? n : undefined;
  };
  // A line already over the shelf (added before the count was known) comes down to it.
  useEffect(() => {
    for (const i of items) {
      const cap = capFor(i.variantId);
      if (cap !== undefined && i.quantity > cap) updateQuantity(i.cartKey ?? i.variantId, cap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockCap, items]);

  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && cartOpen) closeCart(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cartOpen, closeCart]);

  async function handleCheckout() {
    setIsCheckingOut(true);
    setCheckoutError(false);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(promo.trim() ? { discountCode: promo.trim() } : {}),
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            ...(i.customAttributes?.length ? { customAttributes: i.customAttributes } : {}),
          })),
        }),
      });
      const { url, error } = (await res.json()) as { url?: string; error?: string };
      if (url) {
        window.location.href = url;
      } else {
        setIsCheckingOut(false);
        setCheckoutError(error || true);
      }
    } catch {
      setIsCheckingOut(false);
      setCheckoutError(true);
    }
  }

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-text/40 z-40" onClick={closeCart} aria-hidden="true" />
          <motion.div key="drawer" role="dialog" aria-modal="true" aria-label="Your bag" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-bg z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-rule">
              <h2 className="font-heading uppercase tracking-[0.12em] text-lg text-text">Your bag</h2>
              <button ref={closeBtnRef} onClick={closeCart} aria-label="Close cart" className="p-2 text-muted hover:text-text transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <LogoImg logo={brand.logo.light} className="h-12 w-auto opacity-90" />
                  <p className="text-muted text-sm">Your bag is empty.</p>
                  <Link href={brand.shopPath} onClick={closeCart} className="text-accent hover:underline text-sm">
                    {brand.id === 'townies' ? 'find your town →' : 'shop the sacks →'}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => {
                    const itemKey = item.cartKey ?? item.variantId;
                    return (
                    <li key={itemKey} className="flex gap-4">
                      <div className="w-20 h-20 rounded bg-surface flex-shrink-0 overflow-hidden relative">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productTitle}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-rule" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text text-sm leading-snug">{item.productTitle}</p>
                        {(() => {
                          // Hide internal attributes (keys starting with "_", e.g. _brand).
                          const shown = item.customAttributes?.filter((a) => !a.key.startsWith('_')) ?? [];
                          return shown.length ? (
                            <ul className="mt-0.5 space-y-0">
                              {shown.map((a) => (
                                <li key={a.key} className="text-muted text-xs">• {a.value}</li>
                              ))}
                            </ul>
                          ) : (
                            // Single-variant products send their own title as the variant name.
                            item.variantName && item.variantName !== item.productTitle ? (
                              <p className="text-muted text-xs mt-0.5">{item.variantName}</p>
                            ) : null
                          );
                        })()}
                        <div className="flex items-center justify-between mt-2">
                          <QuantityStepper
                            quantity={item.quantity}
                            max={capFor(item.variantId)}
                            onDecrement={() => updateQuantity(itemKey, item.quantity - 1)}
                            onIncrement={() => updateQuantity(itemKey, Math.min(item.quantity + 1, capFor(item.variantId) ?? Infinity))}
                          />
                          <button onClick={() => removeItem(itemKey)} aria-label={`Remove ${item.productTitle} from bag`} className="text-muted hover:text-text transition-colors text-xs p-1">
                            <X size={14} />
                          </button>
                        </div>
                        {capFor(item.variantId) !== undefined && item.quantity >= capFor(item.variantId)! && (
                          <p className="mt-1 text-[0.6875rem] text-muted">Only {capFor(item.variantId)} left</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-text">{formatCents(item.priceInCents * item.quantity)}</p>
                      </div>
                    </li>
                  );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-rule px-6 py-4 space-y-3">
                {hasPreorder && (
                  <p className="text-xs leading-relaxed bg-surface text-muted rounded-sm px-3 py-2.5 border border-rule">
                    <span className="font-semibold text-text uppercase tracking-wide">Pre-order in bag.</span>{' '}
                    Your whole order ships together once the pre-order is ready — {PREORDER_SHIP_NOTE.toLowerCase()}.
                  </p>
                )}
                {/* A cart of only Hat & Sack bundles already ships free; the
                    "$X from free shipping" nudge would be wrong there. */}
                {brand.freeShippingCents !== null && !items.every((i) => i.productTitle === 'Hat & Sack Bundle') && (
                  <FreeShippingBar subtotalCents={subtotalCents} thresholdCents={brand.freeShippingCents} />
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-text">{formatCents(subtotalCents)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="cart-promo" className="sr-only">Discount code</label>
                  <input
                    id="cart-promo"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Discount code"
                    autoCapitalize="characters"
                    className="min-w-0 flex-1 rounded-sm border border-rule bg-white px-3 py-2.5 text-sm uppercase text-text placeholder:normal-case placeholder:text-muted focus:border-text focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="block w-full bg-accent text-accent-contrast text-center py-3.5 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {isCheckingOut ? 'Redirecting…' : 'Checkout →'}
                </button>
                {checkoutError && (
                  <p className="text-center text-red-600 text-xs">
                    {typeof checkoutError === 'string' ? checkoutError : 'Something went wrong. Please try again.'}
                  </p>
                )}
                <p className="text-center text-muted text-xs">Shipping &amp; taxes calculated at checkout</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
