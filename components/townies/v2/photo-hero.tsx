import Link from 'next/link';

/**
 * Clean homepage hero (Lucas 11-25: "I would like a cleaner hero section",
 * replacing the hat wheel / one-hat studio heroes). One full-bleed photograph,
 * one headline, one line, two buttons. Desktop: copy on the left over the
 * photo's empty side. Phones: the full 4:5 photo, copy underneath on navy.
 */
type Props = {
  desktopSrc: string;
  mobileSrc: string;
  alt: string;
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
  /** CSS object-position for the desktop photo (keep the hat in frame). */
  focus?: string;
};

export function PhotoHero({ desktopSrc, mobileSrc, alt, eyebrow, headline, sub, cta, ctaSecondary, focus = '70% 50%' }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-[#0D1B2A] text-[#F2EFE8]">
      {/* Phones: the whole photo at 4:5 on top, copy underneath (nothing cropped,
          no text over the hat). Desktop: full-bleed photo, copy on the left. */}
      <picture>
        <source media="(min-width: 1024px)" srcSet={desktopSrc} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileSrc}
          alt={alt}
          fetchPriority="high"
          className="block aspect-[4/5] w-full object-cover sm:max-h-[640px] lg:max-h-none lg:absolute lg:inset-0 lg:-z-10 lg:aspect-auto lg:h-full lg:object-[var(--focus)]"
          style={{ ['--focus' as string]: focus }}
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block lg:bg-[linear-gradient(90deg,rgba(13,27,42,.82)_0%,rgba(13,27,42,.55)_34%,rgba(13,27,42,0)_58%)]" />

      <div className="mx-auto max-w-7xl px-5 pb-10 pt-7 sm:px-8 lg:flex lg:min-h-[min(80vh,720px)] lg:flex-col lg:justify-center lg:pb-16 lg:pt-16">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[#F2EFE8]/80">{eyebrow}</p>
          <h1 className="display mt-3 text-[2.5rem] leading-[1] uppercase! tracking-[0.01em]! sm:text-[3.5rem] lg:whitespace-nowrap lg:text-[3.75rem]">{headline.split('\n').map((line, i) => (<span key={i} className="block">{line}</span>))}</h1>
          <p className="mt-3 max-w-md text-[1rem] leading-relaxed text-[#F2EFE8]/80 sm:text-[1.0625rem]">{sub}</p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <Link
              href={cta.href}
              className="font-label flex min-h-12 items-center justify-center whitespace-nowrap bg-[#F2EFE8] px-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.1em] sm:text-[0.75rem] sm:tracking-[0.14em] text-[#0D1B2A] transition-colors hover:bg-white sm:px-8"
            >
              {cta.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="font-label flex min-h-12 items-center justify-center whitespace-nowrap border border-[#F2EFE8]/70 px-3 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.1em] sm:text-[0.75rem] sm:tracking-[0.14em] text-[#F2EFE8] transition-colors hover:bg-[#F2EFE8] hover:text-[#0D1B2A] sm:px-8"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
