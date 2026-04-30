'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product, ProductVariant } from '@/lib/products/catalog';
import { VariantSelector } from '@/components/product/variant-selector';
import { AddToCartButton } from '@/components/product/add-to-cart-button';

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

interface ProductDetailProps {
  product: Product;
  variants: ProductVariant[];
}

const FAQ_ITEMS = [
  { question: 'How big is it? Will it fit in my bag?', answer: 'About 2.25 inches in diameter — small enough to slip in any pocket or backpack pouch.' },
  { question: 'Is it durable? How long will it last?', answer: 'Hand-stitched cotton means it holds up well to regular use. Most circles get months to years out of one.' },
  { question: 'Can I wash it?', answer: "Spot clean only — hand wash with mild soap, air dry. The pellet fill doesn't love full submersion." },
  { question: 'How fast does it ship?', answer: 'We ship in 1–2 business days. Most domestic orders arrive in 3–5 days.' },
  { question: "What if I don't like it?", answer: "Reach out within 30 days. We'll make it right — that's the whole deal." },
];

export function ProductDetail({ product, variants }: ProductDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '');
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-brand-muted hover:text-brand-rust transition-colors">← back to shop</Link>
      <h1 className="font-display text-4xl text-brand-ink">{product.title}</h1>
      {selectedVariant && (
        <p className="text-2xl text-brand-ink font-medium">{formatCents(selectedVariant.priceInCents)}</p>
      )}
      {variants.length > 1 && (
        <VariantSelector variants={variants} selectedVariantId={selectedVariantId} onSelect={setSelectedVariantId} />
      )}
      {selectedVariant && (
        <AddToCartButton
          variant={{ id: selectedVariant.id, name: selectedVariant.name, priceInCents: selectedVariant.priceInCents }}
          productTitle={product.title}
        />
      )}
      <p className="text-brand-muted text-sm">free shipping on orders $40+ · ships in 1–2 days</p>
      <div className="border-t border-brand-rule pt-6">
        <h2 className="font-display text-xl mb-3">what it is</h2>
        <div className="text-brand-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </div>
      <div>
        <h2 className="font-display text-xl mb-3">specs</h2>
        <ul className="space-y-1 text-brand-muted text-sm">
          <li>Size: ~2.25&quot; diameter</li>
          <li>Weight: ~50g</li>
          <li>Materials: hand-crocheted cotton exterior, plastic pellet fill</li>
          <li>Recommended for: ages 8+</li>
        </ul>
      </div>
      <div>
        <h2 className="font-display text-xl mb-3">questions, answered</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group border-b border-brand-rule pb-3">
              <summary className="cursor-pointer text-sm font-medium text-brand-ink hover:text-brand-rust transition-colors list-none flex justify-between items-center">
                {item.question}
                <span className="text-brand-muted group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-2 text-sm text-brand-muted leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
