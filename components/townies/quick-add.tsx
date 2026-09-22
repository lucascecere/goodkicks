'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart/cart-context';
import { isPreorder } from '@/lib/townies/preorder';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { cn } from '@/lib/utils';

/**
 * "Add to cart" straight off a card.
 *
 * Every hat on this site has ONE variant, so the buy decision on a browse row
 * is genuinely a single click — routing it through the product page first was
 * costing a page load to learn nothing. (A multi-variant product would need the
 * picker, so this falls back to a link when it sees one; today none do.)
 *
 * It mirrors the PDP buy box exactly — same `_brand` attribute, same visible
 * Fulfillment note on pre-orders — so a line added here and a line added there
 * are indistinguishable in the cart and at checkout. Any change to one must be
 * made to the other.
 */
export function QuickAdd({
  product,
  flavor = 'townies',
  className,
  title,
}: {
  product: CollectionProduct;
  flavor?: 'townies' | 'goodkicks';
  className?: string;
  /** Display title override (GK strips its brand prefix). */
  title?: string;
}) {
  const { addItem, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const variant = product.variants.edges[0]?.node;
  const multiVariant = product.variants.edges.length > 1;
  const available = variant?.availableForSale ?? false;
  // Townies only. Good Kicks ships from stock and never pre-orders (confirmed
  // with Lucas 2026-09-08), but at least one GK product still carries a stale
  // `preorder` tag in Shopify — the same stale data `gkDescriptionHtml()`
  // already strips the "Preorder now" sentence for. Honouring the tag here
  // would put "Pre-order" on a button for a bag that ships tomorrow.
  const preorder = flavor === 'townies' && isPreorder(product.tags);

  const base =
    'mt-3 flex w-full items-center justify-center px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.16em] transition-colors';

  if (!variant || !available) {
    return (
      <span className={cn(base, 'cursor-default border border-rule text-muted', className)}>
        Sold out
      </span>
    );
  }

  // A product with choices has to be chosen on its own page.
  if (multiVariant) {
    return (
      <span className={cn(base, 'border border-text text-text group-hover:bg-text group-hover:text-bg', className)}>
        Choose options
      </span>
    );
  }

  function handleAdd(e: React.MouseEvent) {
    // The card is a Link; without this the click both adds the line AND
    // navigates away to the product page, so the drawer opens on a page that
    // is already unloading.
    e.preventDefault();
    e.stopPropagation();
    addItem({
      variantId: variant!.id,
      variantName: product.title,
      productTitle: title ?? product.title,
      priceInCents: Math.round(parseFloat(variant!.price.amount) * 100),
      imageUrl: product.featuredImage?.url,
      customAttributes: [
        { key: '_brand', value: flavor },
        ...(preorder ? [{ key: 'Fulfillment', value: 'Pre-order' }] : []),
      ],
    });
    setAdded(true);
    openCart();
    // Back to the resting label — the drawer is the real confirmation, this is
    // just so the button a shopper returns to isn't stuck saying "Added".
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(base, 'bg-text text-bg hover:bg-accent', className)}
    >
      {added ? 'Added ✓' : preorder ? 'Pre-order' : 'Add to cart'}
    </button>
  );
}
