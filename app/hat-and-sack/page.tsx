import type { Metadata } from 'next';
import Link from 'next/link';
import { getTownieProducts } from '@/lib/shopify/collections';
import { breadcrumbSchema } from '@/lib/seo/site';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { RequestTownBand } from '@/components/townies/request-town-band';
import { HatSackPicker, type HatSackVariants } from '@/components/townies/hat-sack-picker';
import { HAT_SACK_PATH, SACK_POOL, eligibleHats, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { priceCents } = await getHatSackOffer();
  const price = formatUsd(priceCents);
  return {
    title: `Hat & Sack — ${price} | Townies × Good Kicks`,
    description: `Pick a Townies town snapback and we’ll pack a random Good Kicks foot bag with it. ${price} for both, shipped together.`,
    alternates: { canonical: HAT_SACK_PATH },
    openGraph: {
      title: `Hat & Sack — ${price} | Townies × Good Kicks`,
      description: `Pick your town. We pick the bag. ${price} for both.`,
      url: HAT_SACK_PATH,
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function HatAndSackPage() {
  const [products, offer] = await Promise.all([getTownieProducts(), getHatSackOffer()]);

  const hats = eligibleHats(products);
  const price = formatUsd(offer.priceCents);

  const variants: HatSackVariants = {
    shipsNowId: offer.shipsNowId,
    preorderId: offer.preorderId,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Hat & Sack Bundle',
    url: HAT_SACK_PATH,
    image: offer.imageUrl ?? undefined,
    description:
      `A Townies Massachusetts town snapback plus a random Good Kicks v1 foot bag, shipped together for ${price}.`,
    brand: { '@type': 'Brand', name: 'Townies' },
    offers: {
      '@type': 'Offer',
      price: (offer.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      url: HAT_SACK_PATH,
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        variants.shipsNowId || variants.preorderId
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="relative overflow-hidden bg-town-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            jsonLd,
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Hat & Sack', path: HAT_SACK_PATH },
            ]),
          ]).replace(/</g, '\\u003c'),
        }}
      />

      {/* Masthead — the same dark top edge /shop uses, so the promo reads as part
          of the shop rather than as a landing page bolted on beside it. */}
      <section className="relative overflow-hidden bg-town-navy">
        <BrandPattern variant="ma" color="cream" opacity={0.08} size={240} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-3">
            Townies × Good Kicks
          </p>
          <h1 className="font-block font-bold uppercase text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-[0.01em] text-white mb-4">
            Hat &amp; Sack.
          </h1>
          <p className="text-town-cream/80 max-w-md mx-auto leading-relaxed">
            {price} for a town hat and a Good Kicks foot bag. You pick
            the town. We pick the bag.
          </p>
        </div>
      </section>

      <BrandPattern variant="ma" color="forest" opacity={0.05} size={220} fade="b" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-16 pb-20">
        {hats.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-town-muted text-sm mb-6">
              The bundle is between drops. Tell us which town you want next.
            </p>
            <Link
              href="/request-a-town"
              className="inline-flex items-center bg-town-navy text-town-cream px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-town-navy/90 transition-colors"
            >
              Request your town
            </Link>
          </div>
        ) : (
          <HatSackPicker
            hats={hats}
            variants={variants}
            bundleImageUrl={offer.imageUrl}
            bundleCents={offer.priceCents}
            sackCents={offer.sackValueCents}
          />
        )}

        {/* The plain-English terms. A surprise item invites exactly these
            questions, and a promo that makes people go looking for the answer
            loses them on the way. */}
        <div className="mt-16 sm:mt-24 border-t border-town-rule pt-10">
          <h2 className="font-block font-bold uppercase text-lg tracking-[0.02em] text-town-navy mb-6">
            How it works
          </h2>
          <dl className="grid gap-8 sm:grid-cols-3">
            {[
              {
                q: 'Can I choose the foot bag?',
                a: `No — that's what makes it ${price}. It'll be one of the ${SACK_POOL.length} Good Kicks v1 colorways, packed with your hat.`,
              },
              {
                q: 'What if I pick a pre-order town?',
                a: 'The whole bundle ships when that town’s hats land. Checkout will quote the pre-order window, not a ship-now date.',
              },
              {
                q: 'Does it ship as one order?',
                a: 'Yes. One box, one shipping charge, hat and bag together.',
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-block font-bold uppercase text-sm leading-snug tracking-[0.02em] text-town-navy mb-1.5">
                  {item.q}
                </dt>
                <dd className="text-[0.8125rem] leading-relaxed text-town-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <RequestTownBand />
    </div>
  );
}
