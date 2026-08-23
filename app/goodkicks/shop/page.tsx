import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getGoodKicksProducts, type CollectionProduct } from '@/lib/shopify/collections';
import { gkCanonical } from '@/lib/seo/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Shop the Sacks',
  description: 'Premium foot bags, in stock — six colorways. Pick your state and keep the game going.',
  alternates: { canonical: gkCanonical('shop') },
};

function priceLabel(p: CollectionProduct): string {
  const amount = p.variants.edges[0]?.node.price.amount;
  return amount ? `$${parseFloat(amount).toFixed(2)}` : '';
}

export default async function GoodKicksShopPage() {
  const products = await getGoodKicksProducts();

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-brand-rust font-medium mb-3">
          The collection
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-4">shop the sacks.</h1>
        <p className="text-brand-muted max-w-md mx-auto leading-relaxed">
          Premium foot bags, six colorways, properly weighted and built to last. Pick your state
          and keep the circle going.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        {products.length === 0 ? (
          <p className="text-center text-brand-muted text-sm">
            The collection is on its way — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p, i) => {
              const available = p.variants.edges[0]?.node.availableForSale ?? false;
              return (
                <Link key={p.id} href={`/goodkicks/products/${p.handle}`} className="group block">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white border border-brand-rule">
                    {p.featuredImage?.url ? (
                      <Image
                        src={p.featuredImage.url}
                        alt={p.featuredImage.altText ?? p.title}
                        fill
                        priority={i < 4}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-rule" />
                    )}
                    {!available && (
                      <span className="absolute top-3 left-3 bg-brand-ink/80 text-white text-[0.65rem] uppercase tracking-widest px-2 py-1 rounded">
                        Sold out
                      </span>
                    )}
                  </div>
                  <div className="pt-3">
                    <p className="font-medium text-brand-ink text-sm leading-snug group-hover:text-brand-rust transition-colors">
                      {p.title}
                    </p>
                    <p className="text-brand-muted text-sm mt-0.5">{priceLabel(p)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
