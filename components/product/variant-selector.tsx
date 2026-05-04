'use client';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/products/catalog';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  const hasColors = variants.some((v) => v.color);

  if (hasColors) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-brand-muted font-medium">
          colorway —{' '}
          <span className="text-brand-ink">
            {variants.find((v) => v.id === selectedVariantId)?.name ?? ''}
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              title={variant.name}
              className={cn(
                'w-9 h-9 rounded-full border-2 transition-all',
                variant.id === selectedVariantId
                  ? 'border-brand-ink scale-110 shadow-md'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: variant.color ?? '#ccc' }}
              aria-label={variant.name}
              aria-pressed={variant.id === selectedVariantId}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-brand-muted font-medium">select colorway</p>
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
            {variant.name}
          </button>
        ))}
      </div>
    </div>
  );
}
