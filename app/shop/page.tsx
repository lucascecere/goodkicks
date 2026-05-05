import type { Metadata } from 'next';
import Image from 'next/image';
import { GOOD_KICKS_FOOT_BAG } from '@/lib/products/catalog';
import { AddToCartButton } from '@/components/product/add-to-cart-button';

export const metadata: Metadata = {
  title: 'Shop — Good Kicks Foot Bags',
  description: 'Six colorways. One circle. Hand-stitched foot bags at $18 — pick your state and keep the game going.',
};

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

const ballImages: Record<string, string> = {
  'gk-georgia':    '/brand/ball_georgia.png',
  'gk-colorado':   '/brand/ball_colorado.png',
  'gk-nevada':     '/brand/ball_nevada.png',
  'gk-new-york':   '/brand/ball_newyork.png',
  'gk-california': '/brand/ball_california.png',
  'gk-maine':      '/brand/ball_maine.png',
};

export default function ShopPage() {
  const { variants, title } = GOOD_KICKS_FOOT_BAG;

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3 text-center">the collection</p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">pick your colorway.</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          six states. six colorways. hand-stitched foot bags at {fmt(variants[0].priceInCents)} — free shipping on orders $30+.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="bg-white rounded-2xl overflow-hidden border border-brand-rule hover:shadow-lg transition-shadow group"
            >
              {/* Image */}
              <div className="aspect-square relative bg-[#F5EFE3] p-8">
                {ballImages[variant.id] ? (
                  <Image
                    src={ballImages[variant.id]}
                    alt={`Good Kicks ${variant.name} colorway`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full"
                    style={{ backgroundColor: variant.color ?? '#ccc' }}
                  />
                )}
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: variant.color ?? '#ccc' }}
                    />
                    <h2 className="font-display text-xl text-brand-ink">{variant.name}</h2>
                  </div>
                  <p className="text-brand-ink font-medium">{fmt(variant.priceInCents)}</p>
                </div>
                <AddToCartButton
                  variant={{ id: variant.id, name: variant.name, priceInCents: variant.priceInCents }}
                  productTitle={title}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Free shipping note */}
        <p className="text-center text-brand-muted text-sm mt-10">
          free shipping on orders $30+ &nbsp;·&nbsp; ships in 1–2 business days
        </p>
      </div>
    </div>
  );
}
