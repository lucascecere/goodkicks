import Link from 'next/link';
import Image from 'next/image';
import { Price } from '@/components/ui/price';
import shopifyImageLoader from '@/lib/shopify/image-loader';

type ProductCardProps = {
  handle: string;
  title: string;
  price: { amount: string; currencyCode: string };
  image: { url: string; altText: string | null; width: number; height: number } | null;
};

export function ProductCard({ handle, title, price, image }: ProductCardProps) {
  return (
    <Link href={`/products/${handle}`} className="group block">
      <div className="aspect-square relative overflow-hidden rounded bg-brand-rule/20 mb-3">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? title}
            loader={shopifyImageLoader}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-muted text-4xl">🏐</div>
        )}
      </div>
      <h3 className="text-brand-ink font-medium group-hover:text-brand-rust transition-colors">{title}</h3>
      <Price money={price} className="text-brand-muted text-sm mt-0.5" />
    </Link>
  );
}
