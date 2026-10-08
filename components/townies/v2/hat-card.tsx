import Link from 'next/link';
import Image from 'next/image';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { STUDIO_TILE, STUDIO_IMG, altImage, badge, price, styleLine } from './studio';
import { Stars } from './stars';

/**
 * Melin's product tile: the hat on a studio ground, a small status tag, then
 * name and price on one line with the style underneath. Hover cross-fades to
 * the second shot. No button on the tile; the product page sells.
 */
export function HatCard({
  product,
  priority,
  rating,
}: {
  product: CollectionProduct;
  priority?: boolean;
  rating?: { count: number; average: number };
}) {
  const alt = altImage(product);
  const b = badge(product);
  const sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className={`relative aspect-square overflow-hidden ${STUDIO_TILE}`}>
        {product.featuredImage?.url && (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            priority={priority}
            sizes={sizes}
            className={`object-contain p-[6%] ${STUDIO_IMG} transition duration-500 ease-out group-hover:scale-[1.03] ${alt ? 'group-hover:opacity-0' : ''}`}
          />
        )}
        {alt && (
          <Image
            src={alt.url}
            alt=""
            fill
            sizes={sizes}
            className={`object-contain p-[6%] ${STUDIO_IMG} opacity-0 transition duration-500 ease-out group-hover:opacity-100`}
          />
        )}
        {b && (
          <span
            className={`absolute left-3 top-3 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] font-label ${
              b.tone === 'dark' ? 'bg-text text-white' : 'bg-white text-text'
            }`}
          >
            {b.label}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-[0.9375rem] font-semibold text-text leading-snug">{product.title}</p>
        <p className="shrink-0 text-[0.9375rem] text-text">{price(product)}</p>
      </div>
      <p className="mt-0.5 flex items-center gap-2 text-[0.8125rem] text-muted">
        {styleLine(product)}
        {rating && rating.count > 0 && (
          <span className="inline-flex items-center gap-1"><Stars value={rating.average} size={12} />({rating.count})</span>
        )}
      </p>
    </Link>
  );
}
