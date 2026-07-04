import type { Metadata } from 'next';
import Link from 'next/link';
import { getClearanceProducts, type CollectionProduct } from '@/lib/shopify/collections';
import { getAllProducts } from '@/lib/shopify/service';
import { imageForVariant } from '@/lib/shopify/variant-colors';
import { ClearanceCard, type ClearanceItem } from '@/components/townies/clearance-card';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Clearance — Where We Started | Townies',
  description:
    'Good Kicks is where Townies started — premium foot bags for the circle. The originals, on clearance while they last.',
  alternates: { canonical: '/clearance' },
  openGraph: {
    title: 'Clearance — Where We Started | Townies',
    description: 'The Good Kicks originals, on clearance.',
    url: '/clearance',
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

function isGoodKicksProduct(p: { handle: string; title: string }): boolean {
  const h = p.handle.toLowerCase();
  const t = p.title.toLowerCase();
  return h === '3-pack' || h.startsWith('the-good-kick') || t.includes('good kick');
}

function toClearanceItem(p: CollectionProduct): ClearanceItem {
  const variant = p.variants.edges[0]?.node;
  const name = p.title.replace(/^The Good Kick\s*[—–-]\s*/i, '').replace(/^The\s+/i, '');
  return {
    id: p.id,
    name,
    handle: p.handle,
    image: p.featuredImage?.url ?? imageForVariant(p.title) ?? null,
    price: variant
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
          parseFloat(variant.price.amount),
        )
      : null,
    available: variant?.availableForSale ?? false,
  };
}

export default async function ClearancePage() {
  // Prefer the good-kicks collection; before cutover it may be empty, so fall
  // back to the live GK catalog (filtered to GK products only — never towns).
  let products = await getClearanceProducts();
  if (products.length === 0) {
    try {
      const all = (await getAllProducts()) as CollectionProduct[];
      products = all.filter(isGoodKicksProduct);
    } catch {
      // Shopify not configured (e.g. local without env) — show empty state.
      products = [];
    }
  }
  const items = products.map(toClearanceItem);

  return (
    <div className="bg-brand-cream min-h-screen">
      {/* Origin story header */}
      <section className="max-w-3xl mx-auto px-4 sm:px-8 pt-16 sm:pt-24 pb-10 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-rust font-medium mb-4">
          Where we started
        </p>
        <h1 className="font-display text-5xl sm:text-6xl text-brand-ink mb-5">Good Kicks.</h1>
        <p className="text-brand-muted leading-relaxed">
          Before Townies, there was Good Kicks — premium foot bags built to make the circle
          bigger. It taught us how to make something people actually keep. These are the
          originals, on clearance while they last.
        </p>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {items.map((item) => (
              <ClearanceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-center text-brand-muted text-sm py-10">
            The clearance shelf is empty right now —{' '}
            <Link href="/shop" className="underline underline-offset-4 hover:text-brand-rust">
              shop the towns
            </Link>{' '}
            instead.
          </p>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center text-sm lowercase tracking-wide text-town-navy underline underline-offset-4 hover:text-town-forest transition-colors"
          >
            ← back to the towns
          </Link>
        </div>
      </div>
    </div>
  );
}
