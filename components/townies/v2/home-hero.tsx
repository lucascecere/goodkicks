import Link from 'next/link';
import Image from 'next/image';
import { STUDIO_TILE, STUDIO_IMG } from './studio';
import { CrestRail } from './crest-rail';

export type HeroHat = { id: string; src: string; alt: string; title: string; price: string; href: string };

type Props = {
  hats: HeroHat[];
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
  /** 'feature' = one hat, big. 'row' = the line, then a swipe row of every town. */
  variant?: 'feature' | 'row';
};

/**
 * The home hero (2026-11-04, replaces the scroll-turned hat wheel, which Lucas
 * called terrible). No scroll hijack, no motion: on a phone the headline and both
 * buttons sit in the first screen, the hats underneath swipe natively.
 *
 * Blend note: the hats multiply onto the sweep. Nothing between the <img> and the
 * gradient may carry transform/opacity/z-index/animation or the white boxes return.
 */
export function HomeHero({ variant = 'feature', ...p }: Props) {
  if (!p.hats.length) return null;
  return variant === 'row' ? <RowHero {...p} /> : <FeatureHero {...p} />;
}

const SWEEP = 'bg-[radial-gradient(120%_90%_at_70%_40%,#FBFAF7_0%,#EDEAE3_55%,#E2DED5_100%)]';

function Copy({ eyebrow, headline, sub, cta, ctaSecondary, center }: Omit<Props, 'hats' | 'variant'> & { center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : ''}>
      <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">{eyebrow}</p>
      <h1 className="display mt-2 text-[2.5rem] sm:text-[3.75rem] lg:mt-3 lg:text-[4.75rem] text-text">{headline}</h1>
      <p className={`mt-2 max-w-md text-[0.9375rem] leading-relaxed text-text/75 sm:mt-4 sm:text-[1.0625rem] ${center ? 'mx-auto' : ''}`}>{sub}</p>
      <div className={`mt-5 grid grid-cols-2 gap-2 sm:flex sm:gap-3 lg:mt-7 ${center ? 'sm:justify-center' : ''}`}>
        <Link
          href={cta.href}
          className="font-label flex min-h-12 items-center justify-center bg-text px-4 text-center text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black sm:px-8"
        >
          {cta.label}
        </Link>
        {ctaSecondary && (
          <Link
            href={ctaSecondary.href}
            className="font-label flex min-h-12 items-center justify-center border border-text px-4 text-center text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-text hover:text-white sm:px-8"
          >
            {ctaSecondary.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** A: Melin's one-hat hero. The hat is a link to itself; name + price under it. */
function FeatureHero({ hats, ...copy }: Omit<Props, 'variant'>) {
  const hat = hats[0];
  return (
    <section className={SWEEP}>
      <div className="mx-auto grid max-w-[1320px] items-center gap-2 px-4 pb-8 pt-2 sm:px-8 lg:min-h-[calc(100svh-7.5rem)] lg:max-h-[860px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-12">
        <div className="order-2 lg:order-1">
          <Copy {...copy} />
        </div>
        <Link href={hat.href} className="group order-1 block lg:order-2">
          {/* Phones: capped so the copy and buttons still land in the first screen. */}
          <div className="relative mx-auto aspect-[4/3] w-full max-h-[34svh] lg:max-h-none lg:aspect-[5/4]">
            <Image src={hat.src} alt={hat.alt} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className={`object-contain ${STUDIO_IMG}`} />
          </div>
          <p className="mt-1 flex items-baseline justify-center gap-2 text-[0.875rem] lg:justify-end">
            <span className="font-semibold text-text underline-offset-4 group-hover:underline">{hat.title}</span>
            <span className="text-text/70">{hat.price}</span>
          </p>
        </Link>
      </div>
    </section>
  );
}

/** B: the line first, then every town's hat in one swipe row (arrows on desktop). */
function RowHero({ hats, ...copy }: Omit<Props, 'variant'>) {
  return (
    <section className={SWEEP}>
      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-7 sm:px-8 sm:pt-12 lg:pb-14 lg:pt-16">
        <Copy {...copy} center />
        <div className="mt-7 sm:mt-10">
          <CrestRail arrowTop="sm:top-[15vw] lg:top-[12vw] xl:top-[150px]">
            {hats.map((h, i) => (
              <li key={h.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] lg:w-[23%]">
                <Link href={h.href} className="group block">
                  <div className={`relative aspect-square overflow-hidden ${STUDIO_TILE}`}>
                    <Image
                      src={h.src}
                      alt={h.alt}
                      fill
                      priority={i < 3}
                      sizes="(max-width: 640px) 44vw, (max-width: 1024px) 30vw, 23vw"
                      className={`object-contain p-[6%] ${STUDIO_IMG} transition duration-500 ease-out group-hover:scale-[1.03]`}
                    />
                  </div>
                  <p className="mt-2 text-[0.875rem] font-semibold leading-snug text-text">{h.title.replace(/ (Lifestyle|Everyday) Hat$/, '')}</p>
                  <p className="text-[0.8125rem] text-text/70">{h.price}</p>
                </Link>
              </li>
            ))}
          </CrestRail>
        </div>
      </div>
    </section>
  );
}
