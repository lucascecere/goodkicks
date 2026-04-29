'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Price } from '@/components/ui/price';
import { VariantSelector } from '@/components/product/variant-selector';
import { AddToCartButton } from '@/components/product/add-to-cart-button';
import { Accordion } from '@/components/ui/accordion';

type ShopifyMoneyV2 = { amount: string; currencyCode: string };
type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number;
  price: ShopifyMoneyV2;
  compareAtPrice: ShopifyMoneyV2 | null;
  selectedOptions: Array<{ name: string; value: string }>;
  image: { url: string; altText: string | null; width: number; height: number } | null;
};
type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  priceRange: { minVariantPrice: ShopifyMoneyV2 };
};

interface ProductDetailProps {
  product: ShopifyProduct;
  variants: ShopifyProductVariant[];
}

const FAQ_ITEMS = [
  {
    question: "How big is it? Will it fit in my bag?",
    answer: 'About 2.25 inches in diameter — small enough to slip in any pocket or backpack pouch.',
  },
  {
    question: 'Is it durable? How long will it last?',
    answer: 'Hand-stitched cotton means it holds up well to regular use. Most circles get months to years out of one.',
  },
  {
    question: 'Can I wash it?',
    answer: "Spot clean only — hand wash with mild soap, air dry. The pellet fill doesn't love full submersion.",
  },
  {
    question: 'How fast does it ship?',
    answer: 'We ship in 1–2 business days from our warehouse in NH. Most domestic orders arrive in 3–5 days.',
  },
  {
    question: "What if I don't like it?",
    answer: "Reach out within 30 days. We'll make it right — that's the whole deal.",
  },
];

export function ProductDetail({ product, variants }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants.find((v) => v.availableForSale)?.id ?? variants[0]?.id ?? ''
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link href="/" className="text-sm text-brand-muted hover:text-brand-rust transition-colors">
        ← back to shop
      </Link>

      {/* Title */}
      <h1 className="font-display text-4xl text-brand-ink">{product.title}</h1>

      {/* Price */}
      {selectedVariant && (
        <Price
          money={selectedVariant.price}
          compareAtMoney={selectedVariant.compareAtPrice}
          className="text-2xl"
        />
      )}

      {/* Variant selector */}
      {variants.length > 1 && (
        <VariantSelector
          variants={variants}
          selectedVariantId={selectedVariantId}
          onSelect={setSelectedVariantId}
        />
      )}

      {/* Add to cart */}
      {selectedVariant && (
        <AddToCartButton
          variantId={selectedVariantId}
          availableForSale={selectedVariant.availableForSale}
        />
      )}

      {/* Info row */}
      <p className="text-brand-muted text-sm">
        free shipping on orders $40+ · ships in 1–2 days from NH
      </p>

      {/* Description */}
      <div className="border-t border-brand-rule pt-6">
        <h2 className="font-display text-xl mb-3">what it is</h2>
        <div
          className="text-brand-muted leading-relaxed prose-sm"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      </div>

      {/* Specs */}
      <div>
        <h2 className="font-display text-xl mb-3">specs</h2>
        <ul className="space-y-1 text-brand-muted text-sm">
          <li>Size: ~2.25&quot; diameter</li>
          <li>Weight: ~50g</li>
          <li>Materials: hand-crocheted cotton exterior, plastic pellet fill</li>
          <li>Recommended for: ages 8+</li>
        </ul>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="font-display text-xl mb-3">questions, answered</h2>
        <Accordion items={FAQ_ITEMS} />
      </div>
    </div>
  );
}
