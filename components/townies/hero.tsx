import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { HeroSlider } from './hero-slider';

/**
 * Full-bleed editorial hero. Supports a background <video> with a poster image
 * fallback; with neither asset it degrades to a navy field with the MA accent —
 * so the homepage never depends on media we don't have yet. Drop a file in
 * /public/brand and pass `videoSrc` / `posterSrc` to light it up.
 *
 * The headline is BLOCK, not script. The brand sheet assigns display type to
 * College Block and reserves the script for brand-level signatures (the
 * wordmark, the tagline band) — a script H1 was spending the signature on the
 * one line that should hit hardest.
 */
export function Hero({
  eyebrow = 'For real Massholes',
  script = 'Small towns, strong roots —',
  headline = 'Rep your town.',
  sub = 'Hats for people who’d defend their exit off the expressway. Your town, stitched heavy — South Shore first, the rest of the map’s coming.',
  primaryCta = { href: '/shop', label: 'Shop the towns' },
  secondaryCta = { href: '/about', label: 'our story' },
  videoSrc,
  posterSrc,
  slides,
}: {
  eyebrow?: string;
  /** Small script line above the headline — the brand signature, used once. */
  script?: string;
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
    // Sized against the viewport MINUS the header (announcement bar + main bar
    // ≈ 6.75rem), so the hero ends exactly where the fold does instead of
    // pushing its own base out of sight.
    <section className="relative min-h-[32rem] sm:min-h-[38rem] lg:min-h-[calc(100svh-6.75rem)] flex items-end overflow-hidden bg-town-navy">
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

      {/* Vertical scrim for the copy, plus a left-hand one so the headline
          holds up over a bright patch of sky on the wider crops. */}
      <div className="absolute inset-0 bg-gradient-to-t from-town-navy via-town-navy/45 to-town-navy/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-town-navy/55 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-8 pb-14 sm:pb-20 lg:pb-24 text-white">
        <p className="flex items-center gap-3 text-[0.7rem] sm:text-xs uppercase tracking-[0.25em] text-town-cream/70 mb-5">
          <MaMark className="h-2.5 w-auto text-town-cream/50 shrink-0" />
          {eyebrow}
        </p>
        {script ? (
          <p className="font-script text-town-cream/90 text-2xl sm:text-3xl lg:text-4xl leading-none mb-1">
            {script}
          </p>
        ) : null}
        <h1 className="font-block uppercase text-6xl sm:text-8xl lg:text-9xl leading-[0.86] tracking-[-0.01em] text-white mb-6">
          {headline}
        </h1>
        <p className="max-w-xl text-town-cream/80 text-base sm:text-lg leading-relaxed mb-9">
          {sub}
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center bg-town-cream text-town-navy px-8 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
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
