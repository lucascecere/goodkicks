import Link from 'next/link';
import Image from 'next/image';

/**
 * Home band for the two volume routes (Lucas, 10-07): custom hats (their logo)
 * leads, wholesale (our town hats by the box) is the second link.
 */
export function BulkSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1320px] gap-3 px-4 pb-12 sm:px-8 sm:pb-16 lg:grid-cols-2 lg:gap-5">
        <div className="flex flex-col justify-center bg-text p-8 text-white sm:p-12 lg:p-16">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/60">Custom hats</p>
          <h2 className="display mt-4 text-[2.25rem] sm:text-[3rem]">Your logo, our stitching.</h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/75">
            Businesses, teams, schools and fundraisers. Mock it up in a couple of minutes, then get a price
            within two business days. 25 to 200 hats.
          </p>
          <Link
            href="/custom-hats/build"
            className="font-label mt-8 w-fit bg-white px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-[#F1EEE8]"
          >
            Build your hat
          </Link>
          <Link href="/wholesale" className="mt-5 w-fit text-[0.875rem] text-white/70 underline underline-offset-4 hover:text-white">
            Stocking our town hats in your shop? Wholesale
          </Link>
        </div>
        {/* One photograph where the 2x2 of product tiles was: the hat grid is
            already on the page above, and the Braintree pile says "bulk" in one
            frame (Lucas, 10-07). Same footprint as the four tiles. */}
        <div className="relative aspect-square overflow-hidden bg-[#F1EEE8] lg:aspect-auto lg:min-h-[560px]">
          <Image
            src="/brand/scene/bulk-order.jpg"
            alt="A pile of Braintree Townies snapbacks fresh from the embroiderer"
            fill
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
