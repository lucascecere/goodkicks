import Link from 'next/link';
import Image from 'next/image';
import { STUDIO_IMG } from './studio';

export type HeroHat = { id: string; src: string; alt: string; title: string; price: string; href: string };

type Props = {
  hats: HeroHat[];
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
};

/**
 * The home hero (2026-11-04, replaces the scroll-turned hat wheel, which Lucas
 * called terrible). Lucas picked the one-hat layout over a swipe row. No scroll
 * hijack, no motion: on a phone the hat, headline and both buttons all sit in the
 * first screen. Headline is all caps (Lucas, 11-04).
 *
 * Blend note: the hats multiply onto the sweep. Nothing between the <img> and the
 * gradient may carry transform/opacity/z-index/animation or the white boxes return.
 */
export function HomeHero(p: Props) {
  if (!p.hats.length) return null;
  return <FeatureHero {...p} />;
}

const SWEEP = 'bg-[radial-gradient(120%_90%_at_70%_40%,#FBFAF7_0%,#EDEAE3_55%,#E2DED5_100%)]';

function Copy({ eyebrow, headline, sub, cta, ctaSecondary }: Omit<Props, 'hats'>) {
  return (
    <div>
      <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">{eyebrow}</p>
      <h1 className="display mt-2 text-[2.125rem] uppercase! tracking-[0.01em]! sm:text-[3.25rem] lg:mt-3 lg:text-[3.75rem] xl:text-[4.25rem] text-text">{headline}</h1>
      <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-text/75 sm:mt-4 sm:text-[1.0625rem]">{sub}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:gap-3 lg:mt-7">
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

/** Melin's one-hat hero. The hat is a link to itself; name + price under it. */
function FeatureHero({ hats, ...copy }: Props) {
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
