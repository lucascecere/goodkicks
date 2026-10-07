import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { townPages, regionHref } from '@/lib/townies/towns';
import { STUDIO_IMG, STUDIO_TILE } from './studio';
import { ShelfHeader } from './shelf-header';

/** Shop by region: one studio card per region with a fan of its hats. */
export function RegionCards({ products }: { products: CollectionProduct[] }) {
  const map = new Map<string, { label: string; towns: string[]; imgs: string[] }>();
  for (const t of townPages(products)) {
    const r = map.get(t.region) ?? { label: t.regionLabel, towns: [], imgs: [] };
    r.towns.push(t.name);
    const img = t.products[0]?.featuredImage?.url;
    if (img && r.imgs.length < 3) r.imgs.push(img);
    map.set(t.region, r);
  }
  const regions = [...map.entries()].sort((a, b) => b[1].towns.length - a[1].towns.length);
  if (regions.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
        <ShelfHeader title="Shop by region" sub="Sorted by where you’re from. Not there yet? Ask for it." link={{ href: '/request-a-town', label: 'Request a town' }} />
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {regions.map(([region, r]) => (
            <Link key={region} href={regionHref(region)} className={`group relative flex flex-col overflow-hidden ${STUDIO_TILE} p-5 sm:p-6`}>
              <div className="relative h-36 sm:h-44">
                {r.imgs.map((src, i) => (
                  <div
                    key={src}
                    className="absolute top-0 h-full w-[62%] transition-transform duration-500 group-hover:-translate-y-1"
                    style={{ left: `${i * (r.imgs.length > 1 ? 38 / (r.imgs.length - 1) : 19)}%`, zIndex: 3 - i }}
                  >
                    <Image src={src} alt="" fill sizes="200px" className={`object-contain ${STUDIO_IMG}`} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="display text-[1.5rem] text-text">{r.label}</p>
                  <p className="mt-1 text-[0.8125rem] text-muted line-clamp-1">{r.towns.join(' · ')}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-text transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
