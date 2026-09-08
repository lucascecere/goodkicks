import type { Metadata } from 'next';
import Link from 'next/link';
import { getGoodKicksProducts } from '@/lib/shopify/collections';
import { PageMasthead } from '@/components/townies/page-masthead';
import { TownTickerLinked } from '@/components/townies/town-ticker';
import { ProductCard } from '@/components/townies/product-card';
import { ClosingBand } from '@/components/townies/closing-band';
import { gkDisplayName } from '@/lib/goodkicks/names';
import { GOODKICKS } from '@/lib/brand/brands';
import { breadcrumbSchema, gkCanonical } from '@/lib/seo/site';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Shop the Sacks',
  description:
    'Premium foot bags, in stock, free shipping. Pick your colorway and keep the circle going.',
  alternates: { canonical: gkCanonical('shop') },
};

/** The Townies /shop, in Good Kicks' clothes: masthead, ticker, grid, closing band. */
export default async function GoodKicksShopPage() {
  const products = await getGoodKicksProducts();
  const names = products.map((p) => ({ slug: p.handle, name: gkDisplayName(p.title) }));

  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbSchema([
              { name: 'Good Kicks', path: gkCanonical('') },
              { name: 'Shop', path: gkCanonical('shop') },
            ]),
          ),
        }}
      />
      <PageMasthead eyebrow="The collection" title="shop the sacks." align="center" pattern="none">
        <p className="text-ink-contrast/80 max-w-md mx-auto leading-relaxed -mt-2">
          Properly weighted, built to last, free shipping. Pick your colorway and keep the circle
          going.
        </p>
        {products.length > 0 && (
          <p className="mt-7 text-[0.68rem] uppercase tracking-[0.22em] text-ink-contrast/60">
            {products.length} {products.length === 1 ? 'colorway' : 'colorways'}
          </p>
        )}
      </PageMasthead>

      <TownTickerLinked towns={names} hrefFor={(h) => `${GOODKICKS.productBase}/${h}`} dot />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-20">
        {products.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted text-sm mb-6">The collection is on its way — check back soon.</p>
            <Link
              href={GOODKICKS.supportPath}
              className="inline-flex items-center bg-ink text-ink-contrast px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-accent hover:text-accent-contrast transition-colors"
            >
              Ask about a bulk order
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                productBase={GOODKICKS.productBase}
                title={gkDisplayName(p.title)}
                fit="cover"
              />
            ))}
          </div>
        )}
      </div>

      <ClosingBand
        eyebrow="Buying for a circle?"
        title="clubs, dorms, campus groups."
        body="We do sack accounts for college clubs, dormitory programs and campus organizations. Tell us how many and we'll sort you out."
        cta={{ href: GOODKICKS.supportPath, label: 'Get in touch' }}
        secondary={{ href: '/goodkicks#ambassadors', label: 'or become an ambassador' }}
      />
    </div>
  );
}
