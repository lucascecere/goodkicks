'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { stagger, useAnimate } from 'framer-motion';
import { BLOSSOM_PIN, WORDMARK, WORDMARK_VIEWBOX } from '@/lib/stick/marks';

const GREEN = '#1F3A2A';
const LILAC = '#B89BD8';
const CREAM = '#F4F0E8';

// Scene geometry (viewBox 0 0 1000 560). The ball rolls from its tee spot to
// the cup; the pin is the approved blossom pin scaled to 0.3 and dropped so its
// cup lands on the hole.
const GROUND = 432;
const BALL_X = 328;
const HOLE_X = 790;
const PIN_SCALE = 0.3;
const BLOSSOM_Y = 300 * PIN_SCALE + (GROUND - 882 * PIN_SCALE);

// The wordmark's pole path carries the ball finial as a second subpath; split
// them so the stick can grow before the ball pops on top.
const [W_POLE, W_BALL] = (() => {
  const i = WORDMARK.pole.d.indexOf('ZM');
  return [WORDMARK.pole.d.slice(0, i + 1), WORDMARK.pole.d.slice(i + 1)];
})();

const PETALS = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + (i % 2 ? 0.2 : -0.1);
  const r = 70 + (i % 3) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r - 10, rotate: (i % 2 ? 1 : -1) * (120 + i * 25) };
});

// Pivots as fractions of each element's own box (framer applies these to SVG).
const ARMS = { originX: 0.1, originY: 0.05 };
const BASE = { originX: 0.5, originY: 1 };
const MID = { originX: 0.5, originY: 0.5 };
const HOIST = { originX: 0, originY: 0.5 };

export function StickComingSoon() {
  const [scope, animate] = useAnimate();
  const [done, setDone] = useState(false);
  const run = useRef(0);

  const finish = useCallback(async () => {
    run.current += 1;
    const t = { duration: 0 };
    await Promise.all([
      animate('.sk-scene', { opacity: 0 }, t),
      animate('.sk-w', { opacity: 1, y: 0 }, t),
      animate('.sk-wpole', { ...BASE, scaleY: 1, opacity: 1 }, t),
      animate('.sk-wball', { ...MID, opacity: 1, scale: 1 }, t),
      animate('.sk-wflag', { ...HOIST, scaleX: 1, opacity: 1 }, t),
      animate('.sk-after', { opacity: 1, y: 0 }, t),
    ]);
    setDone(true);
  }, [animate]);

  const play = useCallback(async () => {
    const id = ++run.current;
    const live = () => run.current === id;
    setDone(false);
    const t = { duration: 0 };
    await Promise.all([
      animate('.sk-scene', { opacity: 0, y: 0 }, t),
      animate('.sk-arms', { ...ARMS, rotate: 0 }, t),
      animate('.sk-ball', { x: 0, y: 0, opacity: 1, scale: 1 }, t),
      animate('.sk-pin', { ...BASE, rotate: 0 }, t),
      animate('.sk-petal', { ...MID, x: 0, y: 0, opacity: 0, rotate: 0, scale: 0.5 }, t),
      animate('.sk-w', { opacity: 0, y: 24 }, t),
      animate('.sk-wpole', { ...BASE, scaleY: 0, opacity: 1 }, t),
      animate('.sk-wball', { ...MID, opacity: 0, scale: 0 }, t),
      animate('.sk-wflag', { ...HOIST, scaleX: 0, opacity: 1 }, t),
      animate('.sk-after', { opacity: 0, y: 12 }, t),
    ]);

    // Address, backswing, stroke.
    await animate('.sk-scene', { opacity: 1 }, { duration: 0.5 });
    if (!live()) return;
    await animate('.sk-arms', { rotate: 17 }, { duration: 0.75, ease: 'easeInOut', delay: 0.15 });
    if (!live()) return;
    await animate('.sk-arms', { rotate: -8 }, { duration: 0.16, ease: 'easeIn' });
    if (!live()) return;

    // Roll: fast off the face, dying into the cup.
    animate('.sk-arms', { rotate: 0 }, { duration: 0.7, delay: 0.25, ease: 'easeInOut' });
    await animate('.sk-ball', { x: HOLE_X - BALL_X }, { duration: 1.9, ease: [0.12, 0.6, 0.35, 1] });
    if (!live()) return;
    await animate('.sk-ball', { y: 12, scale: 0.55, opacity: 0 }, { duration: 0.2, ease: 'easeIn' });
    if (!live()) return;

    // In the hole: the pin shivers and the blossom throws its petals.
    animate('.sk-pin', { rotate: [0, 6, -4, 2, 0] }, { duration: 0.8, ease: 'easeOut' });
    const petals = Array.from(scope.current.querySelectorAll('.sk-petal')) as Element[];
    petals.forEach((el, i) =>
      animate(
        el,
        { x: PETALS[i].x, y: [0, PETALS[i].y, PETALS[i].y + 40], rotate: PETALS[i].rotate, opacity: [0, 1, 0], scale: 1 },
        { duration: 1.3, ease: 'easeOut' },
      ),
    );
    await new Promise((r) => setTimeout(r, 900));
    if (!live()) return;

    // Hand off to the wordmark: the stick grows out of the I and the flag runs up.
    await animate('.sk-scene', { opacity: 0, y: 16 }, { duration: 0.5, ease: 'easeIn' });
    if (!live()) return;
    await animate('.sk-w', { opacity: 1, y: 0 }, { duration: 0.55, ease: 'easeOut', delay: stagger(0.07) });
    if (!live()) return;
    await animate('.sk-wpole', { scaleY: 1 }, { duration: 0.45, ease: [0.2, 0.8, 0.3, 1] });
    if (!live()) return;
    animate('.sk-wball', { opacity: 1, scale: [0, 1.25, 1] }, { duration: 0.35 });
    await animate('.sk-wflag', { scaleX: [0, 1.08, 0.97, 1] }, { duration: 0.8, ease: 'easeOut' });
    if (!live()) return;
    await animate('.sk-after', { opacity: 1, y: 0 }, { duration: 0.6, ease: 'easeOut', delay: stagger(0.1) });
    if (live()) setDone(true);
  }, [animate, scope]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else play();
  }, [play, finish]);

  return (
    <div
      ref={scope}
      className="min-h-[100svh] flex flex-col items-center px-4"
      style={{ background: CREAM, color: GREEN }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-center py-10">
        <button
          type="button"
          onClick={done ? undefined : finish}
          aria-label={done ? 'Stick logo' : 'Skip intro'}
          className="relative w-full max-w-[800px] aspect-[1000/560] cursor-default"
        >
          {/* The putt */}
          <svg viewBox="90 96 860 482" className="sk-scene absolute inset-0 w-full h-full" opacity={0} aria-hidden>
            <ellipse cx="520" cy={GROUND + 8} rx="450" ry="44" fill={GREEN} opacity="0.07" />
            <path d={`M90,${GROUND} H950`} stroke={GREEN} strokeWidth="5" strokeLinecap="round" />

            <g className="sk-pin">
              <g transform={`translate(${HOLE_X - 500 * PIN_SCALE} ${GROUND - 882 * PIN_SCALE}) scale(${PIN_SCALE})`}>
                <path d={BLOSSOM_PIN.cup} fill={GREEN} />
                <path d={BLOSSOM_PIN.pole} fill={GREEN} />
                <path d={BLOSSOM_PIN.blossom} fill={LILAC} />
                <path d={BLOSSOM_PIN.center} fill={GREEN} />
              </g>
            </g>
            {PETALS.map((_, i) => (
              <g key={i} transform={`translate(${HOLE_X} ${BLOSSOM_Y})`}>
                <path className="sk-petal" d="M0,-11C7,-6 7,6 0,11C-7,6 -7,-6 0,-11Z" fill={LILAC} opacity={0} />
              </g>
            ))}

            {/* Golfer: flat pictogram, facing the hole */}
            <g stroke={GREEN} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M234,352 L214,428 M234,352 L254,428" strokeWidth="17" />
              <path d="M234,352 L252,290" strokeWidth="22" />
            </g>
            <circle cx="262" cy="258" r="21" fill={GREEN} />
            <path d="M240,254 A22,22 0 0 1 284,252 L302,257 L284,261 L240,261 Z" fill={LILAC} />
            <g className="sk-arms">
              <path d="M252,292 L282,352" stroke={GREEN} strokeWidth="14" strokeLinecap="round" />
              <path d="M282,352 L300,424" stroke={GREEN} strokeWidth="6" strokeLinecap="round" />
              <rect x="289" y="421" width="28" height="10" rx="3" fill={GREEN} />
            </g>
            <circle className="sk-ball" cx={BALL_X} cy={GROUND - 10} r="9" fill="#fff" stroke={GREEN} strokeWidth="3" />
          </svg>

          {/* The logo */}
          <svg
            viewBox={WORDMARK_VIEWBOX}
            className="absolute inset-0 m-auto w-[82%] h-full"
            role="img"
            aria-label="Stick. Golf by Townies."
          >
            <path className="sk-w" d={WORDMARK.st.d} fill={GREEN} opacity={0} />
            <path className="sk-w" d={WORDMARK.i.d} fill={GREEN} opacity={0} />
            <path className="sk-w" d={WORDMARK.ck.d} fill={GREEN} opacity={0} />
            <path className="sk-w" d={WORDMARK.rule.d} fill={GREEN} opacity={0} />
            <path
              className="sk-w"
              d={WORDMARK.subline.d}
              fill={GREEN}
              stroke={GREEN}
              strokeWidth={WORDMARK.subline.boost}
              strokeLinejoin="round"
              opacity={0}
            />
            <path className="sk-wpole" d={W_POLE} fill={GREEN} opacity={0} />
            <path className="sk-wball" d={W_BALL} fill={GREEN} opacity={0} />
            <path className="sk-wflag" d={WORDMARK.pennant.d} fill={LILAC} opacity={0} />
          </svg>
        </button>

        <div className="w-full max-w-md text-center mt-2 sm:mt-4">
          <p className="sk-after text-[11px] font-semibold tracking-[0.32em] uppercase" style={{ opacity: 0 }}>
            Coming soon
          </p>
          <p
            className="sk-after mt-3 text-xl sm:text-2xl leading-snug"
            style={{ opacity: 0, fontFamily: 'Baskerville, "Baskerville Old Face", "Libre Baskerville", Georgia, serif' }}
          >
            Golfwear and accessories from Townies.
          </p>
          <p className="sk-after mt-2 text-sm text-[#1F3A2A]/75" style={{ opacity: 0 }}>
            Headcovers, hats and more. Leave your email to hear about the first drop.
          </p>
          <div className="sk-after mt-6" style={{ opacity: 0 }}>
            <NotifyForm />
          </div>
        </div>
      </div>

      <footer className="w-full max-w-[880px] flex items-center justify-between gap-4 py-6 text-xs border-t" style={{ borderColor: `${GREEN}22` }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <svg viewBox="330 100 340 800" className="h-6 w-auto" aria-hidden>
            <path d={BLOSSOM_PIN.pole} fill={GREEN} />
            <path d={BLOSSOM_PIN.blossom} fill={LILAC} />
            <path d={BLOSSOM_PIN.center} fill={GREEN} />
            <path d={BLOSSOM_PIN.cup} fill={GREEN} />
          </svg>
          <span>A line from Townies</span>
        </Link>
        <button
          type="button"
          onClick={play}
          className={`underline underline-offset-4 hover:opacity-70 transition-opacity ${done ? '' : 'invisible'}`}
        >
          Replay
        </button>
      </footer>
    </div>
  );
}

function NotifyForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      // Stick is a Townies line, so signups land on the Townies list.
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, brand: 'townies' }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="text-sm font-medium">You&rsquo;re on the list.</p>;
  }

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col sm:flex-row gap-2">
      <label htmlFor="stick-email" className="sr-only">Email</label>
      <input
        id="stick-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full sm:flex-1 h-12 px-4 rounded-full bg-white/70 border outline-none focus:bg-white text-sm"
        style={{ borderColor: `${GREEN}33`, color: GREEN }}
      />
      <button
        type="submit"
        disabled={state === 'sending'}
        className="h-12 px-6 rounded-full text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: GREEN, color: CREAM }}
      >
        {state === 'sending' ? 'Adding…' : 'Notify me'}
      </button>
      </div>
      {state === 'error' && <p className="mt-2 text-xs text-red-700">Something went wrong. Try again?</p>}
    </form>
  );
}
