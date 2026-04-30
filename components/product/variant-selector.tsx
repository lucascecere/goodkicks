'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/products/catalog';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-brand-muted font-medium">select pack</p>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            className={cn(
              'px-5 py-2.5 rounded border text-sm font-medium transition-all',
              variant.id === selectedVariantId
                ? 'border-brand-rust bg-brand-rust text-white'
                : 'border-brand-rule text-brand-ink hover:border-brand-rust/50'
            )}
          >
            {variant.name} — {formatCents(variant.priceInCents)}
          </button>
        ))}
      </div>
    </div>
  );
}
