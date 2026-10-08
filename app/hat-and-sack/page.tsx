import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTownieProducts, getGoodKicksProducts } from '@/lib/shopify/collections';
import { breadcrumbSchema } from '@/lib/seo/site';
import { HatSackPicker } from '@/components/townies/hat-sack-picker';
import { HAT_SACK_LIVE, HAT_SACK_PATH, eligibleHats, eligibleSacks, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  if (!HAT_SACK_LIVE) return { title: 'Not Found', robots: { index: false, follow: false } };
  const offer = await getHatSackOffer();
  const price = `from ${formatUsd(Math.min(...Object.values(offer.tiers).map((t) => t.cents)))}`;
  return {
    title: { absolute: `Hat & Sack, ${price} With Shipping | Townies × Good Kicks` },
    description: `Any Townies hat in stock plus any Good Kicks foot bag in stock, ${price} with shipping included. Shipped together in one box.`,
    alternates: { canonical: HAT_SACK_PATH },
  };
}

/**
 * Hat & Sack v2 (Lucas, 2026-10-08): any in-stock hat + any in-stock foot bag,
 * one price with shipping included. Lists follow live Shopify stock.
 */
export default async function HatAndSackPage() {
  if (!HAT_SACK_LIVE) notFound();

  const [townies, goodkicks, offer] = await Promise.all([getTownieProducts(), getGoodKicksProducts(), getHatSackOffer()]);
  const hats = eligibleHats(townies);
  const sacks = eligibleSacks(goodkicks);
  const t = offer.tiers;
  const from = formatUsd(Math.min(t.everyday.cents, t.standard.cents, t.titletown.cents));
  const price = from;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Hat & Sack Bundle',
    image: offer.imageUrl ?? undefined,
    description: `Any in-stock Townies hat plus any in-stock Good Kicks foot bag, shipped together from ${from} with shipping included.`,
    brand: { '@type': 'Brand', name: 'Townies' },
    offers: {
      '@type': 'Offer',
      price: (Math.min(t.everyday.cents, t.standard.cents, t.titletown.cents) / 100).toFixed(2),
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
            Any hat on the shelf, any foot bag on the shelf. From {from} for both, shipping included, packed in one box.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-8 sm:pt-14">
        {hats.length === 0 || sacks.length === 0 || !t.standard.id ? (
          <div className="py-10 text-center">
            <p className="mb-6 text-muted">The bundle is between restocks. Check back soon.</p>
            <Link href="/shop" className="inline-flex bg-text px-7 py-3.5 font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white">
              Shop the hats
            </Link>
          </div>
        ) : (
          <HatSackPicker hats={hats} sacks={sacks} tiers={t} />
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
