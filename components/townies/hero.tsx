'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { BrandImage } from '@/components/ui/brand-image';
import { cn } from '@/lib/utils';

/**
 * The homepage hero: a photograph, a small caption, one button — and, with more
 * than one slide, a cross-fading carousel.
 *
 * EACH SLIDE CARRIES ITS OWN COPY. A carousel that rotates the picture while the
 * words stay put makes the photograph decorative, which is the thing this hero
 * was rebuilt to stop doing. A slide is a campaign: its own town, its own line,
 * its own link.
 *
 * With a single slide this renders exactly as the static hero did — no timer,
 * no controls, no client work beyond mounting.
 *
 * The container is a fixed aspect ratio rather than viewport height, so the
 * image is never scaled up to fill a tall screen, and there is one scrim pair
 * anchored to the bottom-left corner where the caption actually sits.
 *
 * The headline is BLOCK, not script. The brand sheet assigns display type to
 * College Block and reserves the script for brand-level signatures — on the
 * homepage that means the wordmark alone.
 */

export type HeroSlide = {
  imageSrc?: string | null;
  /** Recomposed crop for narrow screens — a 16:10 frame does not survive a phone. */
  mobileSrc?: string | null;
  imageAlt: string;
  eyebrow?: string;
  headline: string;
  sub?: string;
  cta: { href: string; label: string };
};

const ADVANCE_MS = 6000;

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  const count = slides.length;
  const multi = count > 1;

  const go = useCallback((next: number) => setIdx(((next % count) + count) % count), [count]);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    // No timer for a single slide, while the pointer is over the hero, or for
    // anyone who has asked for less motion — an auto-advancing carousel is a
    // moving distraction they explicitly opted out of. The dots still work.
    if (!multi || paused || reducedMotion.current) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), ADVANCE_MS);
    return () => clearInterval(t);
    // `idx` is a dependency so picking a slide by hand RESTARTS the countdown.
    // Without it the interval keeps its original phase and can advance off a
    // just-chosen slide a fraction of a second later.
  }, [multi, paused, count, idx]);

  if (count === 0) return null;
  const active = slides[idx];

  return (
    <section
      className="relative w-full aspect-square sm:aspect-[16/10] overflow-hidden bg-town-navy"
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label={multi ? 'Featured towns' : undefined}
      // Hover pauses. Focus does NOT: clicking a dot leaves it focused, so a
      // focus-based pause never lifts and the carousel stops for good after the
      // first interaction. Picking a slide restarts the countdown instead —
      // see the `idx` dependency on the timer.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.imageSrc ?? i}
          className={cn(
            'absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none',
            i === idx ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={i !== idx}
        >
          <BrandImage
            src={slide.imageSrc}
            mobileSrc={slide.mobileSrc}
            alt={i === idx ? slide.imageAlt : ''}
            tone="navy"
            // Only the first slide is the LCP candidate; eager-loading the rest
            // makes the hero compete with itself on the initial paint.
            priority={i === 0}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Two scrims, both anchored to the bottom-left corner where the caption
          sits. A bottom band handles the horizon, and a corner-weighted radial
          keeps the copy legible over a bright frame without washing the caps. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-town-navy/85 via-town-navy/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_0%_100%,rgba(13,27,42,0.8)_0%,rgba(13,27,42,0.35)_38%,transparent_66%)]" />

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-14 text-white">
        {/* Keyed on the index so the copy re-runs its fade on every change,
            rather than swapping mid-cross-fade with the old line still up. */}
        <div key={idx} className="max-w-md animate-[hero-copy_.7s_ease-out_both]">
          {active.eyebrow && (
            <p className="flex items-center gap-2.5 text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/80 mb-3">
              <MaMark className="h-2 w-auto shrink-0 opacity-70" />
              {active.eyebrow}
            </p>
          )}
          <h1 className="font-block font-bold uppercase text-[1.75rem] sm:text-[2rem] lg:text-[2.5rem] leading-[0.98] tracking-[0.005em]">
            {active.headline}
          </h1>
          {active.sub && (
            <p className="text-[0.8125rem] leading-relaxed text-town-cream/80 mt-2.5">{active.sub}</p>
          )}
          <Link
            href={active.cta.href}
            className="mt-6 inline-flex items-center rounded-none bg-town-cream px-6 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-navy transition-colors hover:bg-white"
          >
            {active.cta.label}
          </Link>
        </div>

        {multi && (
          <div className="mt-7 flex items-center gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={slide.imageSrc ?? i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${slide.headline}`}
                aria-current={i === idx}
                className="group py-2"
              >
                {/* A bar rather than a dot: it reads as a progress track and
                    gives a bigger hit area on a phone than a 8px circle. */}
                <span
                  className={cn(
                    'block h-[3px] w-8 transition-colors',
                    i === idx ? 'bg-town-cream' : 'bg-town-cream/30 group-hover:bg-town-cream/60',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
