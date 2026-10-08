'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
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
 * turns the wheel, so each hat in turn rolls up into the centre while the
 * copy stays put. Pinned with `sticky`; the scroll length is one step per hat.
 *
 * Blend note: the hats are multiplied onto the sweep. The sticky panel carries
 * the gradient itself (it is the stacking context the blend sees), and the
 * transforms live on the <img> that blends, never on a wrapper, or the white
 * product backgrounds come back as boxes.
 */
const STEP_SVH = 42;

function sized(src: string, w: number) {
  return `${src}${src.includes('?') ? '&' : '?'}width=${w}`;
}

function WheelHatImg({ hat, index, pos }: { hat: WheelHat; index: number; pos: MotionValue<number> }) {
  const d = useTransform(pos, (p) => index - p);
  const x = useTransform(d, (v) => `${v * 48}%`);
  const y = useTransform(d, (v) => `${v * 78}%`);
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2) * 0.24);
  const opacity = useTransform(d, (v) => {
    const a = Math.abs(v);
    return a <= 1 ? 1 - a * 0.35 : Math.max(0, 0.65 - (a - 1) * 0.65);
  });
  return (
    <motion.img
      src={sized(hat.src, 1100)}
      alt={index === 0 ? hat.alt : ''}
      draggable={false}
      style={{ x, y, scale, opacity }}
      className="absolute left-[8%] top-[14%] h-[72%] w-[84%] select-none object-contain mix-blend-multiply will-change-transform"
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
  const n = reduce ? 1 : hats.length;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const pos = useTransform(scrollYProgress, (p) => p * Math.max(n - 1, 0));
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(pos, 'change', (v) => setCurrent(Math.min(n - 1, Math.max(0, Math.round(v)))));
  const hat = hats[current];
  if (!hats.length) return null;

  return (
    <section ref={ref} style={{ height: `calc(100svh + ${(n - 1) * STEP_SVH}svh)` }} className="relative">
      <div className="sticky top-[4.75rem] sm:top-[5.5rem] h-[calc(100svh-4.75rem)] sm:h-[calc(100svh-5.5rem)] overflow-hidden bg-[radial-gradient(120%_90%_at_70%_45%,#FBFAF7_0%,#EDEAE3_55%,#E2DED5_100%)]">
        <div className="mx-auto grid h-full max-w-[1320px] grid-rows-[1fr_auto] px-4 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:grid-rows-1 lg:gap-8">
          <div className="order-2 self-center pb-8 lg:order-1 lg:pb-0">
            <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/70">{eyebrow}</p>
            <h1 className="display mt-3 text-[2.75rem] sm:text-[4rem] lg:text-[5rem] text-text">{headline}</h1>
            <p className="mt-4 max-w-md text-[1rem] sm:text-[1.0625rem] leading-relaxed text-text/75">{sub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
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
          </div>
          <div className="relative order-1 min-h-0 lg:order-2">
            {hats.slice(0, n).map((h, i) => (
              <WheelHatImg key={h.id} hat={h} index={i} pos={pos} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
