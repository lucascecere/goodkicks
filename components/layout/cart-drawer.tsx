'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { BrandLogo } from '@/components/brand/brand-logo';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export function CartDrawer() {
  const { items, cartOpen, closeCart, subtotalCents, removeItem, updateQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

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
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            ...(i.customAttributes?.length ? { customAttributes: i.customAttributes } : {}),
          })),
        }),
      });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        setIsCheckingOut(false);
        setCheckoutError(true);
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
                  <BrandLogo variant="script" className="h-10 w-auto opacity-90" />
                  <p className="text-muted text-sm">Your bag is empty.</p>
                  <Link href="/shop" onClick={closeCart} className="text-accent hover:underline text-sm">find your town →</Link>
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
                            <p className="text-muted text-xs mt-0.5">{item.variantName}</p>
                          );
                        })()}
                        <div className="flex items-center justify-between mt-2">
                          <QuantityStepper
                            quantity={item.quantity}
                            onDecrement={() => updateQuantity(itemKey, item.quantity - 1)}
                            onIncrement={() => updateQuantity(itemKey, item.quantity + 1)}
                          />
                          <button onClick={() => removeItem(itemKey)} aria-label={`Remove ${item.productTitle} from bag`} className="text-muted hover:text-text transition-colors text-xs p-1">
                            <X size={14} />
                          </button>
                        </div>
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
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-text">{formatCents(subtotalCents)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="block w-full bg-accent text-accent-contrast text-center py-3.5 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm hover:bg-accent/90 transition-colors disabled:opacity-60"
                >
                  {isCheckingOut ? 'Redirecting…' : 'Checkout →'}
                </button>
                {checkoutError && (
                  <p className="text-center text-red-600 text-xs">Something went wrong — please try again.</p>
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
