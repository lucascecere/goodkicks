import Link from 'next/link';
import Image from 'next/image';
import { Price } from '@/components/ui/price';
import shopifyImageLoader from '@/lib/shopify/image-loader';

type FeaturedProductProps = {
  product: {
    handle: string;
    title: string;
    description: string;
    featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
    variants: { edges: Array<{ node: { id: string; price: { amount: string; currencyCode: string } } }> };
  } | null;
};

export function FeaturedProduct({ product }: FeaturedProductProps) {
  if (!product) {
    return (
      <section id="featured" className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
        <div className="max-w-7xl mx-auto text-center py-16">
          <p className="font-display text-2xl text-brand-muted">we&apos;re stocking the shelves.</p>
          <p className="text-brand-muted mt-2">check back soon — the good kick is coming.</p>
        </div>
      </section>
    );
  }

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <section id="featured" className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          {/* Product image */}
          <div className="md:col-span-3">
            <div className="aspect-square relative rounded-lg overflow-hidden bg-brand-rule/20">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? product.title}
                  loader={shopifyImageLoader}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🏐</div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="md:col-span-2 space-y-6">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">the good kick</p>
            <h2 className="font-display text-4xl text-brand-ink">{product.title}</h2>
            {firstVariant && (
              <Price money={firstVariant.price} className="text-2xl text-brand-ink" />
            )}
            <p className="text-brand-muted leading-relaxed">{product.description}</p>
            <Link
              href={`/products/${product.handle}`}
              className="inline-flex items-center text-brand-rust font-medium hover:gap-2 transition-all group"
            >
              shop now <span className="ml-1 group-hover:ml-2 transition-all">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
