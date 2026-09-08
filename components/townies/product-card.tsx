import Link from 'next/link';
import Image from 'next/image';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { isPreorder } from '@/lib/townies/preorder';
import { LOW_STOCK_THRESHOLD } from '@/lib/shopify/stock-copy';

// Product-framed card for the launch drop (hats + designs) — the product name is
// a normal title, NOT the town-as-hero treatment used by TownCard. Feeds off the
// CollectionProduct shape (featuredImage + first variant price/availability).

function priceLabel(p: CollectionProduct): string {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2)}` : '';
}

/**
 * The second gallery image, or null when there isn't a distinct one.
 *
 * Shopify usually repeats the featured image as the first gallery entry, so
 * "the next picture" is index 1 — but not always, and a couple of products only
 * have the one shot. Comparing URLs rather than trusting the index means a
 * single-image product simply doesn't animate instead of sliding to a duplicate
 * of itself. `images` is optional at runtime: /clearance casts a product from a
 * different query that may not select it.
 */
function alternateImage(p: CollectionProduct) {
  const featured = p.featuredImage?.url;
  const gallery = p.images?.edges?.map((e) => e.node) ?? [];
  return gallery.find((img) => img.url !== featured) ?? null;
}

export function ProductCard({
  product,
  priority,
  productBase = '/products',
  title,
  fit = 'contain',
}: {
  product: CollectionProduct;
  priority?: boolean;
  /** '/goodkicks/products' on the Good Kicks shop. */
  productBase?: string;
  /** Display title override (GK strips its brand prefix). */
  title?: string;
  /**
   * Townies shots are hats on a white sweep, so they sit contained with a
   * margin; the Good Kicks shots are full-frame on wood and want to fill.
   */
  fit?: 'contain' | 'cover';
}) {
  const img = fit === 'cover' ? 'object-cover' : 'object-contain p-3';
  const available = product.variants.edges[0]?.node.availableForSale ?? false;
  const preorder = isPreorder(product.tags);
  const alt = alternateImage(product);

  return (
    <Link href={`${productBase}/${product.handle}`} className="group block">
      <div className="relative aspect-square rounded-sm overflow-hidden bg-white border border-rule">
        {product.featuredImage?.url ? (
          <>
            {/* The alternate shot waits UNDERNEATH at inset-0, not parked off
                the card: an off-card pane never intersects the viewport, so
                next/image would leave it unloaded and the first hover would
                reveal nothing. Both panes carry bg-white because
                object-contain leaves transparent margins that would otherwise
                show one image through the other. */}
            {alt ? (
              <div className="absolute inset-0 bg-white">
                <Image
                  src={alt.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={img}
                />
              </div>
            ) : null}
            {/* Straight cut, no transition — the cover pane simply hides and
                the alternate is already sitting behind it. */}
            <div
              className={`absolute inset-0 bg-white ${alt ? 'group-hover:opacity-0' : ''}`}
            >
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={img}
              />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-rule" />
        )}
        {preorder ? (
          <span className="absolute top-3 left-3 bg-ink text-ink-contrast text-[0.6rem] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full">
            Pre-order
          </span>
        ) : available && typeof product.stock === 'number' && product.stock > 0 ? (
          <span className="absolute top-3 left-3 bg-accent text-accent-contrast text-[0.6rem] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full">
            {product.stock <= LOW_STOCK_THRESHOLD ? `In stock · ${product.stock} left` : 'In stock'}
          </span>
        ) : !available ? (
          <span className="absolute top-3 left-3 bg-ink/80 text-white text-[0.6rem] font-semibold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="pt-3">
        <p className="font-medium text-text text-sm leading-snug group-hover:text-accent transition-colors">
          {title ?? product.title}
        </p>
        <p className="text-muted text-sm mt-0.5">{priceLabel(product)}</p>
      </div>
    </Link>
  );
}
