'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';

export type ColorwayProduct = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  imageUrl: string | null;
};

interface BundlePickerProps {
  bundleVariantId: string;
  priceInCents: number;
  bundleImageUrl: string | null;
  colorways: ColorwayProduct[];
  packSize?: number;
}

function colorwayName(title: string) {
  return title.replace(/^The Good Kick\s*[—–-]\s*/i, '').toLowerCase();
}

export function BundlePicker({
  bundleVariantId,
  priceInCents,
  bundleImageUrl,
  colorways,
  packSize = 3,
}: BundlePickerProps) {
  const { addItem, openCart } = useCart();
  const [picks, setPicks] = useState<ColorwayProduct[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  function handleColorwayClick(cw: ColorwayProduct) {
    if (!cw.availableForSale) return;
    if (picks.length >= packSize) return;
    setPicks((prev) => [...prev, cw]);
    setFlash(cw.id);
    setTimeout(() => setFlash(null), 400);
  }

  function removePick(index: number) {
    setPicks((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddToCart() {
    if (picks.length < packSize) return;
    const customAttributes = picks.map((p, i) => ({
      key: `Selection ${i + 1}`,
      value: colorwayName(p.title).replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
    const cartKey = `${bundleVariantId}:${picks.map((p) => p.handle).join(':')}`;
    addItem({
      cartKey,
      variantId: bundleVariantId,
      variantName: picks.map((p) => colorwayName(p.title)).join(' · '),
      productTitle: `The ${packSize}-Pack — Build Your Own`,
      priceInCents,
      imageUrl: bundleImageUrl ?? undefined,
      customAttributes,
    });
    openCart();
    setPicks([]);
  }

  const remaining = packSize - picks.length;

  return (
    <div className="space-y-8">
      {/* YOUR PICKS */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3">
          your picks ({picks.length}/{packSize})
        </p>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: packSize }).map((_, i) => {
            const pick = picks[i] ?? null;
            return (
              <div
                key={i}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                  pick
                    ? 'border-brand-ink bg-[#F5EFE3]'
                    : 'border-dashed border-brand-rule bg-brand-cream'
                }`}
              >
                {pick ? (
                  <>
                    {pick.imageUrl && (
                      <Image
                        src={pick.imageUrl}
                        alt={colorwayName(pick.title)}
                        fill
                        className="object-contain p-1"
                        sizes="150px"
                      />
                    )}
                    <button
                      onClick={() => removePick(i)}
                      aria-label={`Remove ${colorwayName(pick.title)}`}
                      className="absolute top-1.5 right-1.5 bg-brand-ink/80 rounded-full p-0.5 text-white hover:bg-brand-ink transition-colors z-10"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-semibold text-brand-ink z-10">
                      {colorwayName(pick.title)}
                    </span>
                  </>
                ) : (
                  <span className="text-brand-rule text-2xl select-none">+</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PICK YOUR COLORWAYS */}
      <div>
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3">
          pick your colorways
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
          {colorways.map((cw) => {
            const name = colorwayName(cw.title);
            const soldOut = !cw.availableForSale;
            const full = picks.length >= packSize;
            const isFlashing = flash === cw.id;
            return (
              <button
                key={cw.id}
                onClick={() => handleColorwayClick(cw)}
                disabled={soldOut || full}
                className={`rounded-xl border-2 p-2.5 flex flex-col items-center gap-1.5 transition-all ${
                  isFlashing
                    ? 'border-brand-ink bg-brand-ink/10 scale-95'
                    : soldOut
                    ? 'border-brand-rule bg-brand-rule/20 opacity-50 cursor-not-allowed'
                    : full
                    ? 'border-brand-rule opacity-40 cursor-not-allowed'
                    : 'border-brand-rule hover:border-brand-ink hover:bg-[#F5EFE3] cursor-pointer active:scale-95'
                }`}
              >
                <div className="relative w-full aspect-square">
                  {cw.imageUrl && (
                    <Image
                      src={cw.imageUrl}
                      alt={name}
                      fill
                      className="object-contain"
                      sizes="120px"
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-brand-ink">{name}</span>
                {soldOut && (
                  <span className="text-[10px] text-brand-muted">out of stock</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ADD TO CART — sticky on mobile */}
      <div className="sticky bottom-0 bg-brand-cream pb-safe pt-3 border-t border-brand-rule -mx-6 px-6 sm:static sm:border-none sm:bg-transparent sm:mx-0 sm:px-0 sm:pt-0">
        <button
          onClick={handleAddToCart}
          disabled={picks.length < packSize}
          className="w-full bg-brand-rust text-white py-4 rounded font-medium text-lg hover:bg-brand-rust/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {remaining > 0
            ? `pick ${remaining} more colorway${remaining !== 1 ? 's' : ''}`
            : `add to cart — $${(priceInCents / 100).toFixed(2)}`}
        </button>
        <p className="text-center text-brand-muted text-xs mt-2">ships in 1–2 weeks</p>
      </div>
    </div>
  );
}
