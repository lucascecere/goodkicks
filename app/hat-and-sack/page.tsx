import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductsByCollectionStrict, GOODKICKS_COLLECTION, TOWNIES_COLLECTION } from '@/lib/shopify/collections';
import { breadcrumbSchema } from '@/lib/seo/site';
import { HatSackPicker } from '@/components/townies/hat-sack-picker';
import { HAT_SACK_LIVE, HAT_SACK_PATH, bundleFromCents, eligibleHats, eligibleSacks, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackFromCents, getHatSackOffer } from '@/lib/shopify/hat-sack-offer';
import { ReloadButton } from './reload-button';

// Rendered per request (the Shopify reads underneath are still cached for 60s).
// Under ISR a single failed Shopify read froze "between restocks" into the page
// for a full minute; now a failure costs one request and a reload fixes it.
export const dynamic = 'force-dynamic';

/** Strict reads: a Shopify failure throws instead of looking like an empty shelf. */
async function loadBundle() {
  try {
    const [townies, goodkicks, offer] = await Promise.all([
      getProductsByCollectionStrict(TOWNIES_COLLECTION),
      getProductsByCollectionStrict(GOODKICKS_COLLECTION),
      getHatSackOffer({ strict: true }),
    ]);
    return { ok: true as const, hats: eligibleHats(townies), sacks: eligibleSacks(goodkicks), offer };
  } catch (err) {
    console.error('[hat-and-sack] Shopify read failed:', err);
    return { ok: false as const };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  if (!HAT_SACK_LIVE) return { title: 'Not Found', robots: { index: false, follow: false } };
  const price = `from ${formatUsd(await getHatSackFromCents())}`;
  return {
    title: { absolute: `Hat & Sack, ${price} With Shipping | Townies × Good Kicks` },
    description: `Any Townies hat in stock plus any Good Kicks foot bag in stock, ${price} with shipping included. They ship together.`,
    alternates: { canonical: HAT_SACK_PATH },
  };
}

/**
 * Hat & Sack v2 (Lucas, 2026-10-08): any in-stock hat + any in-stock foot bag,
 * one price with shipping included. Lists follow live Shopify stock.
 */
export default async function HatAndSackPage() {
  if (!HAT_SACK_LIVE) notFound();

  const data = await loadBundle();
  if (!data.ok) return <BundleUnavailable />;
  const { hats, sacks, offer } = data;
  const t = offer.tiers;
  // Cheapest tier that is actually purchasable with today's shelf.
  const fromCents = bundleFromCents(t, hats, sacks);
  const from = formatUsd(fromCents);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Hat & Sack Bundle',
    image: offer.imageUrl ?? undefined,
    description: `Any in-stock Townies hat plus any in-stock Good Kicks foot bag, shipped together from ${from} with shipping included.`,
    brand: { '@type': 'Brand', name: 'Townies' },
    offers: {
      '@type': 'Offer',
      price: (fromCents / 100).toFixed(2),
      priceCurrency: 'USD',
      itemCondition: 'https://schema.org/NewCondition',
      availability: hats.length && sacks.length && t.standard.id ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'USD' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' } },
    },
  };

  return (
    <div className="bg-bg pb-24 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Hat & Sack', path: HAT_SACK_PATH }])]).replace(/</g, '\\u003c'),
        }}
      />
      <section className="border-b border-rule bg-[#F1EEE8]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="mb-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">Townies × Good Kicks</p>
          <h1 className="display text-[2.5rem] text-text sm:text-[3.25rem]">Hat &amp; Sack.</h1>
          <p className="mt-3 max-w-lg leading-relaxed text-text/75">
            Any hat on the shelf, any foot bag on the shelf. From {from} for both, shipping included.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
        {/* Only a genuinely empty shelf (Shopify answered, nothing eligible)
            reaches this; a failed read renders BundleUnavailable instead. */}
        {hats.length === 0 || sacks.length === 0 || !t.standard.id ? (
          <div className="py-10 text-center">
            <p className="mb-6 text-muted">The bundle is between restocks. Check back soon.</p>
            <Link href="/shop" className="inline-flex bg-text px-7 py-3.5 font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white">
              Shop the hats
            </Link>
          </div>
        ) : (
          <HatSackPicker hats={hats} sacks={sacks} tiers={t} fromCents={fromCents} />
        )}

        <div className="mt-16 border-t border-rule pt-10 sm:mt-20">
          <h2 className="display mb-6 text-[1.75rem] text-text">The short version.</h2>
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { q: 'What can I pick?', a: 'Any hat and any foot bag that are in stock right now. If it is on this page, it ships now.' },
              { q: 'How much is it?', a: `Everyday hat with a Good Kicks bag ${formatUsd(t.everyday.cents)}. Any Lifestyle hat, or an Everyday hat with a Pro bag, ${formatUsd(t.standard.cents)}. Titletown ${formatUsd(t.titletown.cents)}.` },
              { q: 'Is shipping really included?', a: 'Yes, to anywhere in the US. Tax is added at checkout where it applies.' },
              { q: 'How does it ship?', a: 'Together, in the hat box, as one package.' },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-label mb-1.5 text-[0.9375rem] font-bold text-text">{item.q}</dt>
                <dd className="text-[0.875rem] leading-relaxed text-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

/** Shopify didn't answer. Not "between restocks": the shelf may be full. */
function BundleUnavailable() {
  return (
    <div className="bg-bg">
      <section className="border-b border-rule bg-[#F1EEE8]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="mb-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">Townies × Good Kicks</p>
          <h1 className="display text-[2.5rem] text-text sm:text-[3.25rem]">Hat &amp; Sack.</h1>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-8">
        <p className="mb-6 text-muted">We couldn&apos;t load the shelf just now. Give it another try.</p>
        <ReloadButton />
      </div>
    </div>
  );
}
