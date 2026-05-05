import Image from 'next/image';
import Link from 'next/link';
import { COLORWAYS } from './colorways-data';

const doubled = [...COLORWAYS, ...COLORWAYS];

export function FeaturedProduct() {
  return (
    <section id="featured" className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: vertical scrolling ball collection */}
          <div className="overflow-hidden h-[480px] rounded-2xl relative order-last lg:order-first">
            <div
              className="flex flex-col gap-4"
              style={{ animation: 'marquee-vertical 22s linear infinite' }}
            >
              {doubled.map((colorway, i) => (
                <div key={i} className="relative w-full h-44 flex-shrink-0">
                  <Image
                    src={colorway.image}
                    alt={`Good Kicks ${colorway.name} colorway`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain drop-shadow-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right: copy */}
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium max-w-none">the good kick</p>
            <h2 className="font-display text-4xl sm:text-5xl text-brand-ink leading-tight">
              hand-stitched.<br />properly weighted.<br />$18.
            </h2>
            <p className="text-brand-muted leading-relaxed">
              six colorways. one circle. pick your state and keep the game going — hand-crocheted by the same crew that&apos;s been doing it for 30+ years.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-brand-rust text-white px-8 py-4 rounded font-medium text-lg hover:bg-brand-rust/90 transition-colors"
            >
              shop all colorways →
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
