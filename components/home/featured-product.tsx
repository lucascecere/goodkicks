import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products/catalog';

type FeaturedProductProps = { product: Product | null };

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

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

  const firstVariant = product.variants[0];

  return (
    <section id="featured" className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-3">
            <div className="aspect-square relative rounded-lg overflow-hidden bg-brand-rule/20">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].altText ?? product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-8xl">🏐</div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-6 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">the good kick</p>
            <h2 className="font-display text-4xl text-brand-ink">{product.title}</h2>
            {firstVariant && (
              <p className="text-2xl text-brand-ink">{formatCents(firstVariant.priceInCents)}</p>
            )}
            <p className="text-brand-muted leading-relaxed">{product.description}</p>
            <div className="flex justify-center md:justify-start">
              <Link href={`/products/${product.handle}`} className="inline-flex items-center text-brand-rust font-medium hover:gap-2 transition-all group">
                shop now <span className="ml-1 group-hover:ml-2 transition-all">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
