import type { Metadata } from 'next';
import Image from 'next/image';
import { GOOD_KICKS_FOOT_BAG } from '@/lib/products/catalog';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { getProductByHandle } from '@/lib/shopify/service';
import { flattenEdges } from '@/lib/shopify/transforms';
import { colorForVariant, imageForVariant } from '@/lib/shopify/variant-colors';

export const metadata: Metadata = {
  title: 'Shop — Good Kicks Foot Bags',
  description: 'Six colorways. One circle. Hand-stitched foot bags at $18 — pick your state and keep the game going.',
};

type DisplayVariant = {
  id: string;
  name: string;
  displayPrice: string;
  priceInCents: number;
  color: string;
  imgSrc?: string;
};

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

const STATIC_BALL_IMAGES: Record<string, string> = {
  'gk-tennessee':  '/brand/ball_tennessee.png',
  'gk-maine':      '/brand/ball_maine.png',
  'gk-montana':    '/brand/ball_montana.png',
  'gk-new-york':   '/brand/ball_newyork.png',
  'gk-new-mexico': '/brand/ball_newmexico.png',
  'gk-california': '/brand/ball_california.png',
};

export default async function ShopPage() {
  // Prefer live Shopify data; fall back to static catalog until product is set up in Shopify
  const shopifyProduct = await getProductByHandle('good-kicks-foot-bag-v1');

  let variants: DisplayVariant[];
  let productTitle: string;

  if (shopifyProduct) {
    productTitle = shopifyProduct.title;
    variants = flattenEdges(shopifyProduct.variants).map((v) => ({
      id: v.id,
      name: v.title,
      displayPrice: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(v.price.amount)),
      priceInCents: Math.round(parseFloat(v.price.amount) * 100),
      color: colorForVariant(v.title),
      imgSrc: imageForVariant(v.title),
    }));
  } else {
    productTitle = GOOD_KICKS_FOOT_BAG.title;
    variants = GOOD_KICKS_FOOT_BAG.variants.map((v) => ({
      id: v.id,
      name: v.name,
      displayPrice: fmt(v.priceInCents),
      priceInCents: v.priceInCents,
      color: v.color ?? '#ccc',
      imgSrc: STATIC_BALL_IMAGES[v.id],
    }));
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3 text-center">the collection</p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">pick your colorway.</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          six states. six colorways. hand-stitched foot bags at {variants[0]?.displayPrice ?? '$18'} — free shipping on orders $30+.
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
                {variant.imgSrc ? (
                  <Image
                    src={variant.imgSrc}
                    alt={`Good Kicks ${variant.name} colorway`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full rounded-full" style={{ backgroundColor: variant.color }} />
                )}
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: variant.color }} />
                    <h2 className="font-display text-xl text-brand-ink">{variant.name}</h2>
                  </div>
                  <p className="text-brand-ink font-medium">{variant.displayPrice}</p>
                </div>
                <AddToCartButton
                  variant={{ id: variant.id, name: variant.name, priceInCents: variant.priceInCents }}
                  productTitle={productTitle}
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
