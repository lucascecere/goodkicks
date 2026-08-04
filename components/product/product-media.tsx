'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Multi-image PDP gallery: main image + thumbnail strip.
// Rendered by components/product/product-page.tsx for BOTH brands, so it uses only
// SEMANTIC tokens and themes itself from whichever [data-brand] scope it sits under.
// product-page only mounts this when there are 2+ images; a single-image product
// keeps the plain BrandImage slot, which preserves the placeholder fallback.

export type ProductMediaImage = {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
};

export function ProductMedia({
  images,
  productTitle,
  sizes = '(max-width: 1024px) 100vw, 50vw',
}: {
  images: ProductMediaImage[];
  productTitle: string;
  sizes?: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-surface">
        <Image
          src={current.url}
          alt={current.altText ?? productTitle}
          fill
          sizes={sizes}
          priority
          className="object-cover"
        />
      </div>

      <div className="flex gap-3" role="group" aria-label={`${productTitle} images`}>
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show image ${i + 1} of ${images.length}`}
            aria-current={i === active}
            className={cn(
              'relative aspect-square w-20 sm:w-24 overflow-hidden rounded-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
              i === active
                ? 'ring-2 ring-accent'
                : 'border border-rule opacity-70 hover:opacity-100 hover:border-muted',
            )}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
