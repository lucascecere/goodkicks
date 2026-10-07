import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { townPages, townHref } from '@/lib/townies/towns';
import { STUDIO_IMG } from './studio';

/**
 * Homefield's "Shop by conference" row, for towns: one round badge per town
 * showing that town's hat front-on, the name under it, ending in "Request
 * yours". Scrolls sideways on phones; wraps centred on desktop.
 */
export function TownCrests({ products }: { products: CollectionProduct[] }) {
  const towns = townPages(products).map((t) => {
    // Prefer the front view (2nd gallery shot): the crest is the embroidery.
    const p = t.products[0];
    const front = p.images?.edges?.[1]?.node?.url ?? p.featuredImage?.url ?? null;
    return { ...t, front };
  });
  if (towns.length === 0) return null;

  return (
    <section id="towns" className="scroll-mt-24 border-b border-rule bg-white">
      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8 sm:py-10">
        <p className="mb-5 w-full text-center font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">
          Shop by town
        </p>
        <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-x-7 sm:gap-y-6 sm:overflow-visible sm:px-0">
          {towns.map((t) => (
            <li key={t.slug} className="shrink-0">
              <Link href={townHref(t.slug)} className="group flex w-[76px] flex-col items-center gap-2 sm:w-[88px]">
                <span className="relative block h-[76px] w-[76px] overflow-hidden rounded-full bg-[#F1EEE8] ring-1 ring-rule transition group-hover:ring-2 group-hover:ring-text sm:h-[88px] sm:w-[88px]">
                  {t.front && (
                    <Image
                      src={t.front}
                      alt=""
                      fill
                      sizes="88px"
                      className={`object-cover scale-[1.45] ${STUDIO_IMG}`}
                    />
                  )}
                </span>
                <span className="text-center text-[0.75rem] font-semibold leading-tight text-text">{t.name}</span>
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link href="/request-a-town" className="group flex w-[76px] flex-col items-center gap-2 sm:w-[88px]">
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-dashed border-text/40 text-text/60 transition group-hover:border-text group-hover:text-text sm:h-[88px] sm:w-[88px]">
                <Plus size={22} strokeWidth={1.5} />
              </span>
              <span className="text-center text-[0.75rem] font-semibold leading-tight text-text/70">Your town?</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
