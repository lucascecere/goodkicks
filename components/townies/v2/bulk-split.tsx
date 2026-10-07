import Link from 'next/link';
import Image from 'next/image';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { STUDIO_IMG, STUDIO_TILE } from './studio';

/** Bulk orders as a split: copy on navy, a 2x2 of real hats on the studio ground. */
export function BulkSplit({ products }: { products: CollectionProduct[] }) {
  const hats = products.filter((p) => p.featuredImage?.url).slice(0, 4);
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1320px] gap-3 px-4 pb-12 sm:px-8 sm:pb-16 lg:grid-cols-2 lg:gap-5">
        <div className="flex flex-col justify-center bg-text p-8 text-white sm:p-12 lg:p-16">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/60">Bulk orders</p>
          <h2 className="display mt-4 text-[2.25rem] sm:text-[3rem]">Ordering for the whole team?</h2>
          <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/75">
            Teams, schools, businesses and fundraisers. 25 to 200 hats, priced within two business days.
          </p>
          <Link
            href="/wholesale"
            className="font-label mt-8 w-fit bg-white px-8 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-[#F1EEE8]"
          >
            Get a bulk price
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:gap-5">
          {hats.map((p) => (
            <div key={p.id} className={`relative aspect-square ${STUDIO_TILE}`}>
              <Image src={p.featuredImage!.url} alt="" fill sizes="(max-width:1024px) 50vw, 25vw" className={`object-contain p-[8%] ${STUDIO_IMG}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
