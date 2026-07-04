import Image from 'next/image';
import Link from 'next/link';
import { COLORWAYS } from './colorways-data';

const doubled = [...COLORWAYS, ...COLORWAYS];

export function FeaturedProduct() {
  return (
    <section id="featured" className="py-20 px-6 sm:px-8 bg-brand-ink text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: vertical scrolling ball collection */}
          <div className="overflow-hidden h-[480px] relative order-last lg:order-first">
            {/* Soft fade top */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#1A1A1A] to-transparent z-10 pointer-events-none" />
            {/* Soft fade bottom */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#1A1A1A] to-transparent z-10 pointer-events-none" />

            <div
              className="flex flex-col"
              style={{ animation: 'marquee-vertical 22s linear infinite' }}
            >
              {doubled.map((colorway, i) => (
                <div key={i} className="relative w-full h-48 flex-shrink-0">
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
            <p className="text-xs uppercase tracking-widest text-white/40 font-medium max-w-none">the good kick</p>
            <h2 className="font-display text-4xl sm:text-5xl text-white leading-tight">
              premium materials.<br />properly weighted.<br />made to last.
            </h2>
            <p className="text-white/60 leading-relaxed">
              six colorways. one circle. pick your state and keep the game going — made by the same crew that&apos;s been doing it for 30+ years.
            </p>
            <Link
              href="/goodkicks/shop"
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
