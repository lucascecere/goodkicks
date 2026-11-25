import Link from 'next/link';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { townPages } from '@/lib/townies/towns';
import { GIVEAWAY, giveawayEligible, giveawayOpen } from '@/lib/townies/giveaway';

/**
 * Homepage giveaway band (Dec 2026). Shows only while the giveaway is open.
 * Photo of the Norwood hat (generated from real photos, same as the IG post),
 * the pitch, and a row of every eligible town: tapping a hat opens /giveaway
 * with that town picked.
 */
export function GiveawayBand({ products }: { products: CollectionProduct[] }) {
  if (!giveawayOpen()) return null;
  const towns = townPages(products)
    .filter((t) => giveawayEligible(t.slug))
    .map((t) => ({ slug: t.slug, name: t.name, image: t.products[0]?.featuredImage?.url ?? null }));

  return (
    <section id="giveaway" className="bg-[#0D1B2A] text-[#F2EFE8]">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-stretch">
        <picture className="block">
          <source media="(min-width: 1024px)" srcSet="/brand/scene/giveaway-norwood.jpg" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/scene/giveaway-norwood-wide.jpg"
            alt="The Norwood hat on a wrapped gift box"
            width={920}
            height={607}
            className="block w-full h-full object-cover aspect-[3/2] lg:aspect-auto lg:max-h-[640px]"
          />
        </picture>
        <div className="px-5 py-10 sm:px-10 sm:py-14 lg:px-14 flex flex-col justify-center min-w-0">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#8FB39A]">
            Giveaway · enter by Sunday, Dec 6
          </p>
          <h2 className="display mt-3 text-[2.25rem] sm:text-[3rem] leading-[1.02]">Win your town’s hat.</h2>
          <p className="mt-3 max-w-xl text-[1rem] sm:text-[1.0625rem] text-[#F2EFE8]/75">
            One free hat for every town below. Tap yours, enter in ten seconds, and we pick one winner per town on {GIVEAWAY.pickLabel}.
          </p>

          <div className="mt-7 -mx-5 px-5 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none]">
            <ul className="flex sm:flex-wrap gap-2 w-max sm:w-auto">
              {towns.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/giveaway?town=${t.slug}&utm_source=home`}
                    className="group block w-[92px] rounded-sm bg-white text-center transition-transform hover:-translate-y-0.5"
                  >
                    {t.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${t.image}${t.image.includes('?') ? '&' : '?'}width=220`}
                        alt=""
                        loading="lazy"
                        className="block w-full aspect-[4/3] object-cover"
                      />
                    ) : (
                      <span className="block w-full aspect-[4/3]" />
                    )}
                    <span className="block px-1 pb-1.5 -mt-1 text-[0.5625rem] font-semibold uppercase tracking-[0.1em] text-[#0D1B2A] leading-tight">
                      {t.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/giveaway?utm_source=home"
              className="font-label inline-block bg-[#F2EFE8] px-6 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#0D1B2A] hover:bg-white"
            >
              Enter the giveaway
            </Link>
            <span className="text-[0.75rem] text-[#F2EFE8]/50">No purchase necessary. Not sponsored by Instagram.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
