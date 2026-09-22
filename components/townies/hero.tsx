'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { BrandImage } from '@/components/ui/brand-image';
import { cn } from '@/lib/utils';

/**
 * The homepage hero: a photograph, a headline, buttons — and, with more than
 * one slide, a cross-fading carousel.

 * REBUILT 2026-09-22 for scale. The old caption sat bottom-left at 40px on a
 * 900px-tall photograph and read as a footnote on someone else's picture;
 * against a site like shopnorivals.com — the brief — the page opened quiet and
 * looked unfinished. The copy now sits bottom-CENTRE in a measured stack
 * (eyebrow → headline → sub → proof chips → two buttons) with the headline on a
 * fluid ramp that reaches 80px at desktop, which is the single change that
 * makes the top of the page feel deliberate.
 *
 * `align="left"` keeps the old composition for any photograph whose subject
 * occupies the centre of the frame.
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
  /** Optional outlined second button beside the primary one. */
  ctaSecondary?: { href: string; label: string };
};


const ADVANCE_MS = 6000;

export function Hero({
  slides,
  mark = true,
  align = 'center',
  chips,
}: {
  slides: HeroSlide[];
  /** The small MA silhouette beside the eyebrow — Townies only. */
  mark?: boolean;
  /** 'left' restores the pre-2026-09 corner caption. */
  align?: 'left' | 'center';
  /**
   * Standing proof shown under the sub — free shipping, where it's designed,
   * how many towns. Belongs to the HERO, not the slide: these are facts about
   * the store that hold whichever campaign is on screen.
   *
   * FACTS ONLY. No review counts and no ratings until there are real ones.
   */
  chips?: string[];
}) {
  const [idx, setIdx] = useState(0);
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
    // No timer for a single slide, and none for anyone who has asked for less
    // motion — an auto-advancing carousel is a moving distraction they
    // explicitly opted out of. The dots remain their way through.
    if (!multi || reducedMotion.current) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), ADVANCE_MS);
    return () => clearInterval(t);
    // `idx` is a dependency so picking a slide by hand RESTARTS the countdown.
    // Without it the interval keeps its original phase and can advance off a
    // just-chosen slide a fraction of a second later.
  }, [multi, count, idx]);

  if (count === 0) return null;
  const active = slides[idx];
  const centred = align === 'center';

  return (
    <section
      // The copy is IN FLOW at the end of a flex column, not absolutely
      // positioned, so a tall stack makes the hero taller instead of climbing
      // out over the photograph. That was the mobile bug the bigger headline
      // introduced: at 390px the headline, sub, three chips and two buttons are
      // about 330px of copy inside a 390px square, and the eyebrow ended up
      // level with the hats. aspect-ratio sets the MINIMUM here — the box is
      // free to grow past it, which is exactly what's wanted.
      // Phone: 85svh, so the ~330px copy stack leaves a real photograph above
      // it rather than a strip. (svh, not vh — vh is the TALLER of Safari's two
      // heights, so a 100vh-ish hero jumps as the URL bar collapses.) Desktop
      // keeps the 16:10 frame, which is already close to a full viewport at
      // 1440 and never scales the image up on a tall screen.
      className="relative flex w-full flex-col justify-end overflow-hidden bg-ink min-h-[85svh] sm:min-h-0 sm:aspect-[16/10]"
      aria-roledescription={multi ? 'carousel' : undefined}
      aria-label={multi ? 'Featured towns' : undefined}
      // NOTHING pauses this on pointer. The hero is 16:10 and sits at the top
      // of the page, so on a laptop it occupies most of the viewport and a
      // resting cursor lands on it — a hover pause meant the carousel simply
      // never advanced for most desktop visitors, which is how it was shipped
      // and immediately reported as "not moving by itself".
      //
      // Pausing on focus is worse still: clicking a dot leaves it focused, so
      // the rotation stops permanently after one interaction.
      //
      // The motion concern is handled where it belongs — prefers-reduced-motion
      // suppresses the timer entirely and leaves the dots as the way through.
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

      {/* Two scrims. The band handles the horizon in both compositions; the
          second is anchored wherever the copy actually sits, so a centred stack
          gets a symmetric pool and a left caption keeps its corner weight.
          Getting this wrong is what washes the caps out.

          Neither is sized to the copy — the copy carries its own gradient (see
          below), because a fixed fraction of the hero cannot cover a block
          whose height changes with the viewport. At 390px the stack is most of
          the frame; at 1440 it is a third of it. */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink/70 via-ink/30 to-transparent" />
      <div
        className={cn(
          'absolute inset-0',
          centred
            ? 'bg-[radial-gradient(90%_70%_at_50%_100%,color-mix(in_srgb,var(--color-ink)_72%,transparent)_0%,color-mix(in_srgb,var(--color-ink)_28%,transparent)_45%,transparent_72%)]'
            : 'bg-[radial-gradient(120%_95%_at_0%_100%,color-mix(in_srgb,var(--color-ink)_80%,transparent)_0%,color-mix(in_srgb,var(--color-ink)_35%,transparent)_38%,transparent_66%)]',
        )}
      />

      <div
        className={cn(
          // Its own gradient ground, so legibility is guaranteed no matter how
          // tall the stack gets or where the photograph is bright.
          'relative w-full bg-gradient-to-t from-ink/95 via-ink/75 to-transparent pt-16 pb-6 px-6 sm:px-10 sm:pb-10 lg:px-14 lg:pb-14 text-white',
          centred && 'flex flex-col items-center',
        )}
      >
        {/* Keyed on the index so the copy re-runs its fade on every change,
            rather than swapping mid-cross-fade with the old line still up. */}
        <div
          key={idx}
          className={cn(
            'animate-[hero-copy_.7s_ease-out_both]',
            centred ? 'max-w-3xl text-center' : 'max-w-md',
          )}
        >
          {active.eyebrow && (
            <p
              className={cn(
                'flex items-center gap-2.5 text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/80 mb-3',
                centred && 'justify-center',
              )}
            >
              {mark && <MaMark className="h-2 w-auto shrink-0 opacity-70" />}
              {active.eyebrow}
            </p>
          )}
          {/* Fluid from 34px on a phone to 80px on a desktop. The old fixed
              40px ceiling is what made a 900px photograph read as empty. */}
          <h1 className="heading text-[clamp(2.125rem,6.2vw,5rem)] leading-[0.94] drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]">
            {active.headline}
          </h1>
          {active.sub && (
            <p
              className={cn(
                'text-[0.9375rem] sm:text-base leading-relaxed text-ink-contrast/85 mt-4',
                centred && 'mx-auto max-w-xl',
              )}
            >
              {active.sub}
            </p>
          )}

          {/* Proof chips — the hero's, not the slide's. */}
          {chips && chips.length > 0 && (
            <ul
              className={cn(
                'mt-6 flex flex-wrap items-center gap-2',
                centred ? 'justify-center' : 'justify-start',
              )}
            >
              {chips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[0.5rem] tracking-[0.12em] sm:px-3.5 sm:py-1.5 sm:text-[0.625rem] sm:tracking-[0.16em] font-semibold uppercase text-white backdrop-blur-sm"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}

          <div className={cn('mt-7 flex flex-wrap gap-3', centred && 'justify-center')}>
            <Link
              href={active.cta.href}
              className="inline-flex items-center rounded-none bg-ink-contrast px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-white"
            >
              {active.cta.label}
            </Link>
            {active.ctaSecondary && (
              <Link
                href={active.ctaSecondary.href}
                className="inline-flex items-center rounded-none border border-white/70 px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-white hover:text-text"
              >
                {active.ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>

        {multi && (
          <div className={cn('mt-7 flex items-center gap-2.5', centred && 'justify-center')}>
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
                    i === idx ? 'bg-ink-contrast' : 'bg-ink-contrast/30 group-hover:bg-ink-contrast/60',
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
