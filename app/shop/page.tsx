import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { getAllProducts } from '@/lib/shopify/service';
import { colorForVariant, imageForVariant } from '@/lib/shopify/variant-colors';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop — Good Kicks Foot Bags',
  description: 'Six colorways. One circle. Hand-stitched foot bags at $18 — pick your state and keep the game going.',
};

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  variants: {
    edges: Array<{
      node: { id: string; availableForSale: boolean; price: { amount: string } };
    }>;
  };
};

export default async function ShopPage() {
  const products: ShopifyProduct[] = await getAllProducts();

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3 text-center max-w-none">the collection</p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">pick your colorway.</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          six states. six colorways. hand-stitched foot bags at $18 — free shipping on orders $35+.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product) => {
            const variant = product.variants.edges[0]?.node;
            if (!variant) return null;
            const priceInCents = Math.round(parseFloat(variant.price.amount) * 100);
            const displayPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(variant.price.amount));
            const color = colorForVariant(product.title, product.tags);
            const imgSrc = imageForVariant(product.title, product.tags);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-brand-rule hover:shadow-lg transition-shadow group"
              >
                {/* Image — clicking goes to product page */}
                <Link href={`/products/${product.handle}`} className="block">
                  <div className="aspect-square relative bg-[#F5EFE3] p-8">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={`Good Kicks ${product.title} colorway`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <Link href={`/products/${product.handle}`}>
                        <h2 className="font-display text-xl text-brand-ink hover:text-brand-rust transition-colors">{product.title}</h2>
                      </Link>
                    </div>
                    <p className="text-brand-ink font-medium">{displayPrice}</p>
                  </div>
                  <AddToCartButton
                    variant={{ id: variant.id, name: product.title, priceInCents }}
                    productTitle="Good Kicks Foot Bag"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-brand-muted text-sm mt-10">
          free shipping on orders $35+ &nbsp;·&nbsp; ships in 1–2 weeks
        </p>
      </div>
    </div>
  );
}
