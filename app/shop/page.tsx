import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getAllProducts } from '@/lib/shopify/service';
import { colorForVariant, imageForVariant } from '@/lib/shopify/variant-colors';
import { IndividualCard, type ShopProduct } from '@/components/product/shop-tabs';

const BUNDLE_HANDLES = ['3-pack'];

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shop — Good Kicks Foot Bags',
  description: 'Six premium foot bag colorways at $9.99 each. Pick your state, keep the circle going. $4 shipping, free on orders $35+.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Shop Good Kicks Foot Bags',
    description: 'Six premium foot bag colorways at $9.99 each. $4 shipping, free on orders $35+.',
    url: '/shop',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop Good Kicks Foot Bags',
    description: 'Six colorways. $9.99 each. $4 shipping, free on orders $35+.',
    images: ['/opengraph-image.png'],
  },
};

type ShopifyProduct = {
  id: string;
  title: string;
  handle: string;
  tags: string[];
  featuredImage?: { url: string; altText: string | null };
  variants: {
    edges: Array<{
      node: { id: string; availableForSale: boolean; price: { amount: string } };
    }>;
  };
};

export default async function ShopPage() {
  const products: ShopifyProduct[] = await getAllProducts();

  const individual: ShopProduct[] = [];
  let bundle: ShopProduct | null = null;

  for (const product of products) {
    const variant = product.variants.edges[0]?.node;
    if (!variant) continue;
    const priceInCents = Math.round(parseFloat(variant.price.amount) * 100);
    const displayPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(parseFloat(variant.price.amount));
    const isBundle = BUNDLE_HANDLES.includes(product.handle);
    const color = colorForVariant(product.title, product.tags);
    const imgSrc = product.featuredImage?.url ?? imageForVariant(product.title, product.tags) ?? null;
    const displayName = product.title
      .replace(/^The Good Kick\s*[—–-]\s*/i, '')
      .replace(/^The\s+/i, '')
      .split(/\s*[—–-]\s*/)[0]
      .toLowerCase();

    const shopProduct: ShopProduct = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      displayName,
      displayPrice,
      compareAtPrice: isBundle ? '$29.97' : undefined,
      priceInCents,
      variantId: variant.id,
      color,
      imgSrc,
      availableForSale: variant.availableForSale,
      isBundle,
      lowStock: !isBundle && displayName === 'massachusetts',
    };

    if (isBundle) {
      bundle = shopProduct;
    } else {
      individual.push(shopProduct);
    }
  }

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 sm:pt-16 pb-8 sm:pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-muted font-medium mb-3">the collection</p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">pick your colorway.</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          six states. six colorways. premium foot bags at $9.99 — $4 shipping, free on orders $35+.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 pb-24">

        {/* Individual colorways grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {individual.map((product) => (
            <IndividualCard key={product.id} product={product} />
          ))}
        </div>

        {/* 3-pack featured section */}
        {bundle && (
          <div className="mt-16 sm:mt-24">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-brand-rule" />
              <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">the bundle</p>
              <div className="h-px flex-1 bg-brand-rule" />
            </div>

            <Link
              href="/products/3-pack"
              className="group block rounded-2xl overflow-hidden bg-white border border-brand-rule hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Left: image or colorway-dots placeholder */}
                <div className="relative aspect-square sm:aspect-auto bg-[#F5EFE3] min-h-[260px] flex items-center justify-center">
                  <Image
                    src="/products/all-sacks.jpg"
                    alt="The 3-Pack — all Good Kicks colorways"
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Right: content */}
                <div className="p-8 sm:p-12 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-brand-rust font-semibold mb-3">bundle · save $5</span>
                  <h2 className="font-display text-4xl sm:text-5xl text-brand-ink mb-3">the 3-pack.</h2>
                  <p className="text-brand-muted leading-relaxed mb-6">
                    pick any 3 colorways — mix, match, or triple up. duplicates welcome. made to order, ships in 1–2 weeks.
                  </p>
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-3xl font-medium text-brand-ink">$24.99</span>
                    <span className="text-brand-muted line-through text-lg">$29.97</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-brand-rust text-white px-6 py-3 rounded font-medium text-sm group-hover:bg-brand-rust/90 transition-colors w-fit">
                    build yours →
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <p className="text-center text-brand-muted text-sm mt-10">
          $4 shipping on all orders &nbsp;·&nbsp; free on orders $35+ &nbsp;·&nbsp; ships in 1–2 weeks
        </p>
      </div>
    </div>
  );
}
