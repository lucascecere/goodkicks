import Link from 'next/link';
import Image from 'next/image';

/**
 * The Good Kicks feature band — the slot the Hat & Sack promo holds on the
 * Townies homepage. Ink ground between the white rail and the cream steps
 * band, so it reads as its own section rather than another row of the rail.
 *
 * The bags are background-removed cutouts of the real product (the store's
 * shots are on wood and cannot sit on ink); a flat lockup of three real sacks
 * is honest about the photography that exists. The BOGO code is the offer the
 * old site has carried since launch — remove the line the day the code dies.
 */
const BAGS = [
  { src: '/brand/goodkicks/bag-montana.webp', alt: 'Montana colorway foot bag' },
  { src: '/brand/goodkicks/bag-tennessee.webp', alt: 'Tennessee colorway foot bag' },
  { src: '/brand/goodkicks/bag-new-mexico.webp', alt: 'New Mexico colorway foot bag' },
];

export function GoodKicksPromoBand({ shopPath }: { shopPath: string }) {
  return (
    <section id="the-good-kick" className="scroll-mt-24 bg-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Order-last on mobile so the offer is read before it is illustrated. */}
          <div className="order-last lg:order-first">
            <div className="flex items-end justify-center gap-3 sm:gap-6">
              {BAGS.map((b, i) => (
                <div
                  key={b.src}
                  className={`relative aspect-square ${i === 1 ? 'w-[38%] max-w-[300px]' : 'w-[28%] max-w-[220px]'}`}
                >
                  <Image src={b.src} alt={b.alt} fill sizes="(max-width: 1024px) 38vw, 300px" className="object-contain" />
                </div>
              ))}
            </div>
          </div>

          <div className="text-center lg:text-left">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-white/70 mb-3">
              The Good Kick
            </p>
            <h2 className="heading text-2xl sm:text-3xl lg:text-4xl leading-none text-white mb-4">
              premium materials. properly weighted. made to last.
            </h2>
            <p className="mx-auto lg:mx-0 max-w-md text-sm leading-relaxed text-white/80">
              32 panels, hand-stitched, filled right — rounder and more forgiving than the flat
              bags in a discount bin. Made by the same crew that&apos;s been doing it for 30+ years.
            </p>
            <p className="mx-auto lg:mx-0 mt-4 max-w-md text-sm leading-relaxed text-white/80">
              <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-accent-contrast mr-2 align-middle">
                Limited time
              </span>
              Buy one, get one free — add any two colorways and use code{' '}
              <span className="font-mono font-bold tracking-widest text-white">BOGOKICKS</span> at checkout.
            </p>
            <Link
              href={shopPath}
              className="mt-7 inline-flex items-center rounded-none bg-ink-contrast px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-white"
            >
              Shop all colorways
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
