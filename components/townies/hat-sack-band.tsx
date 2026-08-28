import Link from 'next/link';
import Image from 'next/image';
import { BrandPattern } from '@/components/townies/brand-pattern';
import { HAT_SACK_LIVE, HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackOffer } from '@/lib/shopify/hat-sack-offer';

/**
 * The Hat & Sack push.
 *
 * Navy, between the white product rail and the cream bulk band — the promo needs
 * its own ground or it reads as another row of the rail above it.
 *
 * The two products are background-removed cutouts, not a staged photograph: the
 * store's own studio shots are white-backed and cannot sit on navy, and the pair
 * has never actually been photographed together. A flat lockup of the two real
 * products is honest about that; a composited "scene" would not be. Replace both
 * with one real photograph when the bundle gets shot.
 *
 * The hat shown is Weymouth because it is the cleanest cutout, not because the
 * bundle is Weymouth-only — the caption and CTA both say the town is the choice.
 */
export async function HatSackBand() {
  if (!HAT_SACK_LIVE) return null;

  const { priceCents } = await getHatSackOffer();

  return (
    <section className="relative overflow-hidden bg-town-navy">
      <BrandPattern variant="ma" color="cream" opacity={0.07} size={240} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Product lockup. Order-last on mobile so the offer is read before
              it is illustrated; a phone shows one thing at a time. */}
          <div className="order-last lg:order-first">
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              <div className="relative w-[58%] max-w-[380px] aspect-[900/641]">
                <Image
                  src="/brand/product/wey-cutout.webp"
                  alt="A Townies town snapback"
                  fill
                  sizes="(max-width: 1024px) 55vw, 380px"
                  className="object-contain"
                />
              </div>
              <span className="font-block font-bold text-2xl sm:text-3xl text-town-cream/50" aria-hidden>
                +
              </span>
              <div className="relative w-[22%] max-w-[150px] aspect-square">
                <Image
                  src="/brand/goodkicks/bag-tennessee.webp"
                  alt="A Good Kicks foot bag"
                  fill
                  sizes="(max-width: 1024px) 22vw, 150px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-3">
              Townies × Good Kicks
            </p>
            <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl lg:text-4xl leading-none tracking-[0.015em] text-white mb-4">
              Hat &amp; Sack. {formatUsd(priceCents)}.
            </h2>
            <p className="mx-auto lg:mx-0 max-w-md text-sm leading-relaxed text-town-cream/80">
              A town hat, plus a Good Kicks foot bag pulled at random from the v1 run.
              You pick the town. We pick the bag. One box, one price.
            </p>
            <Link
              href={HAT_SACK_PATH}
              className="mt-7 inline-flex items-center rounded-none bg-town-cream px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-navy transition-colors hover:bg-white"
            >
              Build your bundle
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
