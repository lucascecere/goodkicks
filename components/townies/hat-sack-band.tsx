import Link from 'next/link';
import Image from 'next/image';
import { HAT_SACK_LIVE, HAT_SACK_PATH, formatUsd } from '@/lib/townies/hat-sack';
import { getHatSackShelf } from '@/lib/shopify/hat-sack-offer';

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
 * When Weymouth is sold out it swaps for an in-stock hat (2026-10-08 audit).
 */
export async function HatSackBand() {
  if (!HAT_SACK_LIVE) return null;

  const { fromCents: priceCents, hats } = await getHatSackShelf();
  // Never picture a hat you can't put in the bundle. Weymouth's cutout while
  // Weymouth is on the shelf; otherwise the first in-stock hat's own Shopify
  // shot (white ground, multiplied onto the cream like the picker tiles).
  const weymouthIn = hats.some((h) => h.handle.startsWith('weymouth'));
  const shelfHat = weymouthIn ? null : hats.find((h) => h.featuredImage?.url) ?? null;

  // v2 (2026-10-08): studio ground, any in-stock hat + any in-stock bag, shipped.
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-4 pb-12 sm:px-8 sm:pb-16">
        <Link href={HAT_SACK_PATH} className="group grid items-center gap-6 bg-[#F1EEE8] p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:p-14">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <div className="relative aspect-[900/641] w-[58%] max-w-[360px] transition-transform duration-500 group-hover:-rotate-2">
              {shelfHat ? (
                <Image src={shelfHat.featuredImage!.url} alt={shelfHat.title} fill sizes="(max-width: 1024px) 55vw, 360px" className="object-contain mix-blend-multiply" />
              ) : (
                <Image src="/brand/product/wey-cutout.webp" alt="A Townies hat" fill sizes="(max-width: 1024px) 55vw, 360px" className="object-contain" />
              )}
            </div>
            <span className="display text-[2rem] text-text/40" aria-hidden>+</span>
            <div className="relative aspect-square w-[24%] max-w-[140px] transition-transform duration-500 group-hover:rotate-6">
              <Image src="/brand/goodkicks/bag-tennessee.webp" alt="A Good Kicks foot bag" fill sizes="(max-width: 1024px) 24vw, 140px" className="object-contain" />
            </div>
          </div>
          <div>
            <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">Townies × Good Kicks</p>
            <h2 className="display mt-3 text-[2rem] text-text sm:text-[2.75rem]">Hat &amp; Sack. From {formatUsd(priceCents)} shipped.</h2>
            <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-text/75">
              Any hat on the shelf plus any Good Kicks foot bag. Shipping included.
            </p>
            <span className="mt-6 inline-flex bg-text px-7 py-3.5 font-label text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors group-hover:bg-black">
              Build your bundle
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
