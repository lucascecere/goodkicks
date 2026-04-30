import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/products/catalog';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] ?? null;
  const firstVariant = product.variants[0];

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="aspect-square relative overflow-hidden rounded bg-brand-rule/20 mb-3">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted text-4xl">🏐</div>
        )}
      </div>
      <h3 className="text-brand-ink font-medium group-hover:text-brand-rust transition-colors">{product.title}</h3>
      {firstVariant && (
        <p className="text-brand-muted text-sm mt-0.5">{formatCents(firstVariant.priceInCents)}</p>
      )}
    </Link>
  );
}
