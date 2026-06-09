'use client';

import { useState } from 'react';
import Image from 'next/image';

type LocalImage = { url: string; altText: string | null; width: number; height: number };

interface ProductGalleryProps {
  images: LocalImage[];
  productTitle?: string;
}

export function ProductGallery({ images, productTitle = 'Product' }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-brand-rule flex items-center justify-center text-6xl">
        🏐
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square relative rounded-2xl overflow-hidden bg-[#F5EFE3]">
        <Image
          src={activeImage.url}
          alt={activeImage.altText ?? productTitle}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={[
                'relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F5EFE3] transition-all',
                i === activeIndex
                  ? 'ring-2 ring-brand-rust ring-offset-2 ring-offset-brand-cream'
                  : 'ring-1 ring-brand-rule hover:ring-brand-muted',
              ].join(' ')}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${productTitle} view ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
