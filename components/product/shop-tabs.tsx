'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';

export type ShopProduct = {
  id: string;
  title: string;
  handle: string;
  displayName: string;
  displayPrice: string;
  compareAtPrice?: string;
  priceInCents: number;
  variantId: string;
  color: string;
  imgSrc: string | null;
  availableForSale: boolean;
  isBundle: boolean;
  lowStock?: boolean;
};

export function IndividualCard({ product }: { product: ShopProduct }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-brand-rule hover:shadow-lg transition-shadow group">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="aspect-square relative bg-[#F5EFE3]">
          {product.imgSrc ? (
            <Image
              src={product.imgSrc}
              alt={`Good Kicks ${product.displayName} colorway`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3/4 h-3/4 rounded-full" style={{ backgroundColor: product.color }} />
            </div>
          )}
          {product.lowStock && (
            <span className="absolute top-2 right-2 bg-brand-rust text-white text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded">
              5 left
            </span>
          )}
        </div>
      </Link>
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: product.color }} />
            <Link href={`/products/${product.handle}`}>
              <h2 className="font-display text-base sm:text-xl text-brand-ink hover:text-brand-rust transition-colors leading-tight">
                {product.displayName}
              </h2>
            </Link>
          </div>
          <p className="text-brand-ink font-medium text-sm sm:text-base flex-shrink-0 pl-4 sm:pl-0">{product.displayPrice}</p>
        </div>
        <AddToCartButton
          variant={{ id: product.variantId, name: product.title, priceInCents: product.priceInCents }}
          productTitle="Good Kicks Foot Bag"
          imageUrl={product.imgSrc ?? undefined}
        />
      </div>
    </div>
  );
}

function BundleCard({ product }: { product: ShopProduct }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-brand-rule hover:shadow-lg transition-shadow group">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="aspect-[4/3] relative bg-[#F5EFE3]">
          {product.imgSrc ? (
            <Image
              src={product.imgSrc}
              alt={product.displayName}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-contain p-8 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1/3 h-1/3 rounded-full bg-brand-rust/20" />
            </div>
          )}
        </div>
      </Link>
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-brand-rust font-semibold">bundle · save $5</span>
            <Link href={`/products/${product.handle}`}>
              <h2 className="font-display text-xl sm:text-2xl text-brand-ink hover:text-brand-rust transition-colors mt-0.5">
                {product.displayName}
              </h2>
            </Link>
            <p className="text-brand-muted text-xs mt-1">pick any 3 colorways — duplicates welcome</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-brand-ink font-medium text-lg">{product.displayPrice}</p>
            {product.compareAtPrice && (
              <p className="text-brand-muted line-through text-sm">{product.compareAtPrice}</p>
            )}
          </div>
        </div>
        <Link
          href={`/products/${product.handle}`}
          className="block w-full bg-brand-rust text-white text-center py-3 rounded font-medium text-sm hover:bg-brand-rust/90 transition-colors"
        >
          build yours →
        </Link>
      </div>
    </div>
  );
}
