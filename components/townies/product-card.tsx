import Link from 'next/link';
import Image from 'next/image';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { isPreorder } from '@/lib/townies/preorder';

// Product-framed card for the launch drop (hats + designs) — the product name is
// a normal title, NOT the town-as-hero treatment used by TownCard. Feeds off the
// CollectionProduct shape (featuredImage + first variant price/availability).

function priceLabel(p: CollectionProduct): string {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2)}` : '';
}

export function ProductCard({
  product,
  priority,
}: {
  product: CollectionProduct;
  priority?: boolean;
}) {
  const available = product.variants.edges[0]?.node.availableForSale ?? false;
  const preorder = isPreorder(product.tags);

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-square rounded-sm overflow-hidden bg-white border border-town-rule">
        {product.featuredImage?.url ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-town-rule" />
        )}
        {preorder ? (
          <span className="absolute top-3 left-3 bg-town-navy text-town-cream text-[0.6rem] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full">
            Pre-order
          </span>
        ) : !available ? (
          <span className="absolute top-3 left-3 bg-town-navy/80 text-white text-[0.6rem] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="pt-3">
        <p className="font-medium text-town-navy text-sm leading-snug group-hover:text-town-forest transition-colors">
          {product.title}
        </p>
        <p className="text-town-muted text-sm mt-0.5">{priceLabel(product)}</p>
      </div>
    </Link>
  );
}
