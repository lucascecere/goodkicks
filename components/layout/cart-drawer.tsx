'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import { QuantityStepper } from '@/components/ui/quantity-stepper';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export function CartDrawer() {
  const { items, cartOpen, closeCart, subtotalCents, removeItem, updateQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
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
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setIsCheckingOut(false);
    }
  }

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-brand-ink/40 z-40" onClick={closeCart} aria-hidden="true" />
          <motion.div key="drawer" role="dialog" aria-modal="true" aria-label="Your bag" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }} className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-brand-cream z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-rule">
              <h2 className="font-display text-xl">your bag</h2>
              <button ref={closeBtnRef} onClick={closeCart} aria-label="Close cart" className="p-2 text-brand-muted hover:text-brand-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rust">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-brand-rule flex items-center justify-center text-3xl">🏐</div>
                  <p className="text-brand-muted">your bag is empty.</p>
                  <Link href="/" onClick={closeCart} className="text-brand-rust hover:underline text-sm">find your kick →</Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={item.variantId} className="flex gap-4">
                      <div className="w-20 h-20 rounded bg-brand-rule flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-ink text-sm leading-snug">{item.productTitle}</p>
                        <p className="text-brand-muted text-xs mt-0.5">{item.variantName}</p>
                        <div className="flex items-center justify-between mt-2">
                          <QuantityStepper
                            quantity={item.quantity}
                            onDecrement={() => updateQuantity(item.variantId, item.quantity - 1)}
                            onIncrement={() => updateQuantity(item.variantId, item.quantity + 1)}
                          />
                          <button onClick={() => removeItem(item.variantId)} aria-label={`Remove ${item.productTitle} from bag`} className="text-brand-muted hover:text-brand-ink transition-colors text-xs p-1">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-brand-ink">{formatCents(item.priceInCents * item.quantity)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand-rule px-6 py-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-muted">subtotal</span>
                  <span className="font-medium text-brand-ink">{formatCents(subtotalCents)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="block w-full bg-brand-rust text-white text-center py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-60"
                >
                  {isCheckingOut ? 'redirecting…' : 'checkout →'}
                </button>
                <p className="text-center text-brand-muted text-xs">free shipping on orders $35+ · taxes at checkout</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
