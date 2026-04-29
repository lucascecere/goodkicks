'use client';

import { useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import { removeFromCart, updateCartLine } from '@/lib/cart/actions';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { Price } from '@/components/ui/price';
import shopifyImageLoader from '@/lib/shopify/image-loader';
import { flattenCartLines } from '@/lib/shopify/transforms';

export function CartDrawer() {
  const { cart, cartOpen, closeCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartOpen]);

  // ESC key dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cartOpen) closeCart();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cartOpen, closeCart]);

  const cartItems = cart ? flattenCartLines(cart) : [];

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-brand-ink/40 z-40"
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-brand-cream z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-rule">
              <h2 className="font-display text-xl">your bag</h2>
              <button
                ref={closeBtnRef}
                onClick={closeCart}
                aria-label="Close cart"
                className="p-2 text-brand-muted hover:text-brand-ink transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rust"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-brand-rule flex items-center justify-center text-3xl">🏐</div>
                  <p className="text-brand-muted">your bag is empty.</p>
                  <Link
                    href="/"
                    onClick={closeCart}
                    className="text-brand-rust hover:underline text-sm"
                  >
                    find your kick →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cartItems.map((item) => (
                    <li key={item.lineId} className="flex gap-4">
                      {item.image && (
                        <div className="relative w-20 h-20 rounded overflow-hidden border border-brand-rule flex-shrink-0">
                          <Image
                            src={item.image.url}
                            alt={item.image.altText ?? item.title}
                            loader={shopifyImageLoader}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-ink text-sm leading-snug">{item.title}</p>
                        <p className="text-brand-muted text-xs mt-0.5">{item.variantTitle}</p>
                        <div className="flex items-center justify-between mt-2">
                          <QuantityStepper
                            quantity={item.quantity}
                            onDecrement={() => {
                              if (!cart) return;
                              startTransition(async () => {
                                await updateCartLine(cart.id, item.lineId, item.quantity - 1);
                              });
                            }}
                            onIncrement={() => {
                              if (!cart) return;
                              startTransition(async () => {
                                await updateCartLine(cart.id, item.lineId, item.quantity + 1);
                              });
                            }}
                            disabled={isPending}
                          />
                          <button
                            onClick={() => {
                              if (!cart) return;
                              startTransition(async () => {
                                await removeFromCart(cart.id, item.lineId);
                              });
                            }}
                            aria-label={`Remove ${item.title} from bag`}
                            className="text-brand-muted hover:text-brand-ink transition-colors text-xs p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Price money={item.lineTotal} className="text-sm" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && cart && (
              <div className="border-t border-brand-rule px-6 py-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brand-muted">subtotal</span>
                  <Price money={cart.cost.subtotalAmount} className="font-medium" />
                </div>
                <a
                  href={cart.checkoutUrl}
                  className="block w-full bg-brand-rust text-white text-center py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors"
                >
                  checkout →
                </a>
                <p className="text-center text-brand-muted text-xs">
                  shipping &amp; taxes calculated at checkout
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
