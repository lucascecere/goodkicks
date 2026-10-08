'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

export type WheelHat = { id: string; src: string; alt: string; title: string; price: string; href: string };

/**
 * The hero as a wheel of hats (Lucas, 2026-10-07): one hat big in the centre,
 * the previous one small above-left, the next one small below-right. Scrolling
 * turns the wheel for the first PINNED_HATS hats, then the page moves on.
 * Scrolling with the pointer over the hats (or swiping them on a phone) turns
 * the ring endlessly without moving the page.
 *
 * Blend note: the hats are multiplied onto the sweep. The sticky panel carries
 * the gradient itself (it is the stacking context the blend sees), and the
 * transforms live on the <img> that blends, never on a wrapper, or the white
 * product backgrounds come back as boxes.
 */
const STEP_SVH = 42;
/** Page scroll only turns the first few hats, so nobody is trapped in the hero (Lucas, 10-07). */
const PINNED_HATS = 3;
/** Wheel-delta pixels per hat when scrolling over the hats themselves. */
const PX_PER_HAT = 180;
/** The C: radians per hat step, and the circle's radii as % of a hat's box. */
const ARC = (52 * Math.PI) / 180;
const RX = 165;
const RY = 105;

/** Signed distance from the centre on a ring of n hats, in (-n/2, n/2]. */
function ringDistance(index: number, pos: number, n: number) {
  let d = (((index - pos) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

function sized(src: string, w: number) {
  return `${src}${src.includes('?') ? '&' : '?'}width=${w}`;
}

function WheelHatImg({ hat, index, pos, n }: { hat: WheelHat; index: number; pos: MotionValue<number>; n: number }) {
  const d = useTransform(pos, (p) => ringDistance(index, p, n));
  // A "C" hugging the right edge of the page (Lucas, 10-07): the next hat
  // rises in from the lower right edge, the current one sits at the C's
  // leftmost point, and the previous one curls back out to the upper right,
  // under the header. Points on a circle whose centre sits off to the right.
  const x = useTransform(d, (v) => `${RX * (1 - Math.cos(v * ARC))}%`);
  const y = useTransform(d, (v) => `${RY * Math.sin(v * ARC)}%`);
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2) * 0.26);
  const opacity = useTransform(d, (v) => {
    const a = Math.abs(v);
    return a <= 1 ? 1 - a * 0.2 : Math.max(0, 0.8 - (a - 1) * 0.8);
  });
  return (
    <motion.img
      src={sized(hat.src, 1100)}
      alt={index === 0 ? hat.alt : ''}
      draggable={false}
      style={{ x, y, scale, opacity }}
      className="absolute left-[2%] top-[17%] h-[66%] w-[78%] select-none object-contain mix-blend-multiply will-change-transform"
    />
  );
}

export function HatWheelHero({
  hats,
  eyebrow,
  headline,
  sub,
  cta,
  ctaSecondary,
}: {
  hats: WheelHat[];
  eyebrow: string;
  headline: string;
  sub: string;
  cta: { href: string; label: string };
  ctaSecondary?: { href: string; label: string };
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const n = reduce ? 1 : hats.length;
  const pinned = Math.max(Math.min(PINNED_HATS, n) - 1, 0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const pagePos = useTransform(scrollYProgress, (p) => p * pinned);
  // Extra turns from scrolling (or swiping) on the hats themselves: endless,
  // the ring wraps. Sprung so a mouse-wheel notch glides instead of jumping.
  const extra = useMotionValue(0);
  const extraSmooth = useSpring(extra, { stiffness: 120, damping: 22, mass: 0.6 });
  const pos = useTransform([pagePos, extraSmooth], ([a, b]: number[]) => a + b);
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(pos, 'change', (v) => setCurrent((((Math.round(v) % n) + n) % n)));

  useEffect(() => {
    const el = stage.current;
    if (!el || n < 2) return;
    let settle: ReturnType<typeof setTimeout> | undefined;
    // Come to rest on a hat, not between two — and always the NEXT hat in the
    // direction of travel, so one slow wheel notch still moves the ring on
    // instead of rounding back to where it started.
    const snap = (dir: number) => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        const at = pagePos.get() + extra.get();
        const target = dir > 0 ? Math.ceil(at - 0.001) : dir < 0 ? Math.floor(at + 0.001) : Math.round(at);
        extra.set(target - pagePos.get());
      }, 200);
    };
    const onWheel = (e: WheelEvent) => {
      // Over the hats the wheel turns the ring and the page stays put. The
      // copy column scrolls the page as normal.
      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      extra.set(extra.get() + delta / PX_PER_HAT);
      snap(Math.sign(delta));
    };
    // Phones: a sideways swipe on the hats turns the ring; vertical still scrolls.
    let startX = 0;
    let startExtra = 0;
    let lastDx = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      startX = e.clientX;
      startExtra = extra.get();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !startX) return;
      lastDx = e.clientX - startX;
      extra.set(startExtra - lastDx / 120);
    };
    const onUp = () => {
      if (!startX) return;
      startX = 0;
      snap(Math.abs(lastDx) > 24 ? -Math.sign(lastDx) : 0);
      lastDx = 0;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      clearTimeout(settle);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [extra, pagePos, n]);

  const hat = hats[current];
  if (!hats.length) return null;

  return (
    <section ref={ref} style={{ height: `calc(100svh + ${pinned * STEP_SVH}svh)` }} className="relative">
      <div className="sticky top-[4.75rem] sm:top-[5.5rem] h-[calc(100svh-4.75rem)] sm:h-[calc(100svh-5.5rem)] overflow-hidden bg-[radial-gradient(120%_90%_at_70%_45%,#FBFAF7_0%,#EDEAE3_55%,#E2DED5_100%)]">
        <div className="mx-auto grid h-full max-w-[1320px] grid-rows-[auto_1fr] px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:grid-rows-1 lg:gap-8">
          {/* Phones: copy first, wheel underneath (Lucas, 10-07). Desktop: side by side. */}
          <div className="order-1 self-center pt-6 lg:pt-0">
            <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">{eyebrow}</p>
            <h1 className="display mt-2 text-[2.5rem] sm:text-[4rem] lg:mt-3 lg:text-[5rem] text-text">{headline}</h1>
            <p className="mt-3 max-w-md text-[0.9375rem] sm:text-[1.0625rem] leading-relaxed text-text/75 lg:mt-4">{sub}</p>
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-3 lg:mt-6">
              <Link href={cta.href} className="font-label bg-text px-7 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black">
                {cta.label}
              </Link>
              {ctaSecondary && (
                <Link href={ctaSecondary.href} className="font-label border border-text px-7 py-3.5 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-text transition-colors hover:bg-text hover:text-white">
                  {ctaSecondary.label}
                </Link>
              )}
            </div>
            {/* What's in the centre of the wheel right now — the wheel is shoppable. */}
            {hat && (
              <Link href={hat.href} className="group mt-8 hidden items-center gap-4 lg:flex">
                <span className="font-label text-[0.6875rem] font-semibold tabular-nums tracking-[0.16em] text-text/50">
                  {String(current + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                </span>
                <span className="h-px w-10 bg-text/25" />
                <span className="text-[0.9375rem] font-semibold text-text group-hover:underline underline-offset-4">{hat.title}</span>
                <span className="text-[0.9375rem] text-text/70">{hat.price}</span>
              </Link>
            )}
            {n > 1 && (
              <p className="mt-4 font-label text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-text/45">
                <span className="hidden lg:inline">Scroll over the hats for every town →</span>
                <span className="lg:hidden">Swipe the hats for every town</span>
              </p>
            )}
          </div>
          <div
            ref={stage}
            className="relative order-2 min-h-0 touch-pan-y overflow-hidden lg:overflow-visible"
          >
            {hats.slice(0, n).map((h, i) => (
              <WheelHatImg key={h.id} hat={h} index={i} pos={pos} n={n} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
