import Image from 'next/image';
import Link from 'next/link';

// The head of /shop. It used to be a line of text on a flat ground; now it's
// the shop's own front window: the headline and counts on one side, a collage
// of three approved photos on the other (the clover scene, Milton on the curb,
// and the real pile of Braintree hats). Lucas, 10-09.
export function ShopHero({
  hatCount,
  townCount,
  regions,
}: {
  hatCount: number;
  townCount: number;
  regions: { slug: string; label: string }[];
}) {
  return (
    <section className="border-b border-rule bg-[#F1EEE8]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:py-16">
        <div className="order-2 lg:order-1">
          <p className="mb-3 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">The shop</p>
          <h1 className="display text-[2.75rem] leading-[0.95] text-text sm:text-[3.75rem] lg:text-[4.5rem]">Every town.</h1>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-text/75">
            {hatCount > 0
              ? `${hatCount} hats across ${townCount} Massachusetts towns, embroidered and shipped from home. Find yours below.`
              : 'The first drop lands soon.'}
          </p>
          {regions.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {regions.map((r) => (
                <Link
                  key={r.slug}
                  href={`/shop?region=${r.slug}#hats`}
                  scroll={false}
                  className="rounded-full border border-text/20 px-4 py-2 font-label text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:border-text hover:bg-text hover:text-white"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Collage: one tall image and two stacked, so it reads as a window
            display rather than a single banner. */}
        <div className="order-1 grid grid-cols-[3fr_2fr] gap-2 sm:gap-3 lg:order-2">
          <div className="relative row-span-2 aspect-[4/5] overflow-hidden">
            <Image
              src="/brand/scene/clover-2-1x1.jpg"
              alt="Milton, Walpole and West Roxbury hats in the clover"
              fill
              priority
              sizes="(max-width: 1024px) 60vw, 34vw"
              className="object-cover"
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/brand/scene/milton-hero-16x10.jpg"
              alt="Two Milton hats on a curb downtown"
              fill
              priority
              sizes="(max-width: 1024px) 40vw, 22vw"
              className="object-cover object-[50%_70%]"
            />
          </div>
          <div className="relative overflow-hidden">
            <Image
              src="/brand/scene/bulk-order.jpg"
              alt="A pile of Braintree hats fresh from the embroiderer"
              fill
              sizes="(max-width: 1024px) 40vw, 22vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
