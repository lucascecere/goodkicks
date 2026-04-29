'use client';

import { ColorSwatch } from '@/components/ui/color-swatch';
import { colorForVariant } from '@/lib/shopify/variant-colors';

type Variant = {
  id: string;
  title: string;
  availableForSale: boolean;
};

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-brand-muted">
        color:{' '}
        <span className="text-brand-ink">
          {variants.find((v) => v.id === selectedVariantId)?.title ?? ''}
        </span>
      </p>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => (
          <ColorSwatch
            key={variant.id}
            color={colorForVariant(variant.title)}
            title={variant.title}
            selected={variant.id === selectedVariantId}
            onClick={() => onSelect(variant.id)}
          />
        ))}
      </div>
    </div>
  );
}
