import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { HeroSlider } from './hero-slider';

/**
 * Full-bleed editorial hero. Supports a background <video> with a poster image
 * fallback; with neither asset it degrades to a navy field with the MA accent —
 * so the homepage never depends on media we don't have yet. Drop a file in
 * /public/brand and pass `videoSrc` / `posterSrc` to light it up.
 */
export function Hero({
  eyebrow = 'For real Massholes',
  headline = 'Rep your town.',
  sub = 'Hats for people who’d defend their exit off the expressway. Your town, stitched heavy — South Shore first, the rest of the map’s coming.',
  primaryCta = { href: '/shop', label: 'Shop the towns' },
  secondaryCta = { href: '/about', label: 'our story' },
  videoSrc,
  posterSrc,
  slides,
}: {
  eyebrow?: string;
  headline?: string;
  sub?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  videoSrc?: string;
  posterSrc?: string;
  /** Multiple background images to cross-fade through. Takes precedence over posterSrc. */
  slides?: string[];
}) {
  return (
    <section className="relative min-h-[82vh] lg:min-h-[92vh] flex items-end overflow-hidden bg-town-navy">
      {/* Background media (graceful) */}
      {slides && slides.length > 0 ? (
        <HeroSlider slides={slides} />
      ) : videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : posterSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterSrc} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_60%]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MaMark className="h-[60%] w-auto text-white/[0.04]" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-town-navy via-town-navy/40 to-town-navy/10" />

      {/* Content */}
      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-8 pb-16 sm:pb-24 text-white">
        <p className="text-[0.7rem] sm:text-xs uppercase tracking-[0.25em] text-town-cream/70 mb-4">
          {eyebrow}
        </p>
        <h1 className="font-script text-6xl sm:text-8xl leading-[0.95] text-white mb-5">
          {headline}
        </h1>
        <p className="max-w-xl text-town-cream/80 text-base sm:text-lg leading-relaxed mb-8">
          {sub}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center bg-town-cream text-town-navy px-7 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            {primaryCta.label}
          </Link>
          <Link
            href={secondaryCta.href}
            className="text-sm lowercase tracking-wide text-town-cream/90 underline underline-offset-4 hover:text-white transition-colors"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </div>

    </section>
  );
}
