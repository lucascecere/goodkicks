'use client';

/**
 * The Townies rotary — spin-to-win popup.
 *
 * A Massachusetts rotary rather than a carnival wheel: navy asphalt ring with
 * cream lane dashes, eight exits off it, and the MA silhouette as the island in
 * the middle. The exit number IS the discount, which is the joke.
 *
 * WHAT THE BROWSER DOES NOT DECIDE: the prize. POST /api/spin draws it server
 * side and returns a signed token; this component only animates to the wedge it
 * is told. Everything below the animation is presentation.
 *
 * Offers live in lib/townies/spin-prizes.ts — change them there, not here.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MA_PATH, MA_VIEWBOX } from '@/components/brand/wordmark';
import { WEDGES, WEDGE_COLORS, WEDGE_INK, CODE_VALID_DAYS } from '@/lib/townies/spin-prizes';

// ---------------------------------------------------------------- geometry --

const VB = 360;            // viewBox is square; everything below is in its units
const C = VB / 2;          // centre
const R_DISC = 174;        // outer edge of the asphalt
const R_WEDGE = 148;       // where the exits stop and the road begins
const R_LANE = 161;        // dashed lane marking, mid-road
const R_PEG = 152;         // the bollards the pointer ticks past
const R_HUB = 50;          // the island

const SLICE = 360 / WEDGES.length;
const TURNS = 6;
const SPIN_MS = 4600;
const SETTLE_MS = 520;
/** Degrees of overshoot the wheel rocks back through as it settles onto a peg. */
const OVERSHOOT = 5;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

/**
 * Type size for a wedge label.
 *
 * A wedge is only ~80px of arc wide where the label sits, so a long offer set
 * at the same size as a short one runs straight over its neighbours — which is
 * how "FREE SHIP" ended up printed across the 20% wedge. Sized off the string
 * rather than hand-tuned per prize, so a new offer typed into spin-prizes.ts
 * fits without anybody having to notice.
 */
function labelSize(label: string): number {
  if (label.length <= 7) return 19;
  if (label.length <= 9) return 15.5;
  if (label.length <= 11) return 13;
  return 11.5;
}

/** Wedge i, measured clockwise from the top. */
function wedgePath(i: number): string {
  const start = i * SLICE;
  const end = start + SLICE;
  const s = polar(R_WEDGE, start);
  const e = polar(R_WEDGE, end);
  return `M ${C} ${C} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R_WEDGE} ${R_WEDGE} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

// ------------------------------------------------------------- persistence --

const STORAGE_KEY = 'townies_rotary_v1';

/**
 * Snooze windows. Somebody who spun but never handed over an email is the most
 * valuable person the popup ever sees, so they get asked again in two days —
 * whereas somebody who closed it unspun clearly meant it, and is left alone for
 * a fortnight. A claimed spin is done for six months.
 */
const SNOOZE_DAYS = { dismissed: 14, spun: 2, claimed: 180 } as const;

type SnoozeReason = keyof typeof SNOOZE_DAYS;

function readSnoozedUntil(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { until?: unknown };
    return typeof parsed.until === 'number' ? parsed.until : 0;
  } catch {
    // Private mode, disabled storage, or a value from an older shape. Treating
    // that as "never seen" shows the popup once too often; treating it as
    // "seen" would hide it from everybody whose browser blocks storage.
    return 0;
  }
}

function snooze(reason: SnoozeReason) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ until: Date.now() + SNOOZE_DAYS[reason] * 864e5, reason }),
    );
  } catch {
    /* storage unavailable — the popup reappears next visit, which is survivable */
  }
}

// ------------------------------------------------------------------- paths --

/** Never interrupt somebody who is buying, reading the admin, or on Good Kicks. */
const BLOCKED_PREFIXES = ['/admin', '/checkout', '/cart', '/goodkicks'];

// ------------------------------------------------------------------- types --

type Step = 'idle' | 'spinning' | 'reveal' | 'success';

/**
 * What the server says the visitor holds. Rendered in preference to the wedge
 * this browser landed on, because on a repeat claim those are different things:
 * the server answers with the code the person already has, and describing it
 * with the new wedge's label would print the wrong offer over a real code.
 */
type ClaimResult = {
  code: string;
  expiresAt: string | null;
  emailed: boolean;
  terms: string;
  prizeLabel: string;
  prizeExit: string;
  alreadyClaimed: boolean;
};

// --------------------------------------------------------------- component --

export function RotarySpin() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [rotation, setRotation] = useState(0);
  const [spinTransition, setSpinTransition] = useState<string | undefined>(undefined);
  const [wedgeIndex, setWedgeIndex] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const [copied, setCopied] = useState(false);

  const rotationRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useRef(false);

  const wedge = wedgeIndex !== null ? WEDGES[wedgeIndex] : null;

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ------------------------------------------------------------- triggering --

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;

    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ?spin=1 opens it on demand (QA, screenshots, showing the client);
    // ?spin=0 keeps it shut, which the site-capture harness needs.
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('spin');
    if (forced === '0') return;
    if (forced === '1') {
      setOpen(true);
      return;
    }

    if (Date.now() < readSnoozedUntil()) return;

    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      cleanup();
      setOpen(true);
    };

    // Three ways in, whichever comes first. A bare "open after 2 seconds" timer
    // is the worst of these — it fires before anyone has seen the shop, so it
    // reads as an obstacle rather than an offer.
    const dwell = setTimeout(fire, 25_000);

    const onScroll = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable > 0.5) fire();
    };

    const onExitIntent = (e: MouseEvent) => {
      // Cursor leaving through the top of the viewport = heading for the tab
      // bar or the address bar. Pointer-based, so it never fires on touch.
      if (e.clientY <= 0 && e.relatedTarget === null) fire();
    };

    function cleanup() {
      clearTimeout(dwell);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onExitIntent);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onExitIntent);

    return cleanup;
  }, [pathname]);

  // ------------------------------------------------ open/close side effects --

  useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);

    // Focus the dialog rather than the spin button: announcing the offer before
    // the control is the right order for a screen reader.
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (step === 'reveal') emailInputRef.current?.focus();
  }, [step]);

  function dismiss() {
    if (step === 'success') snooze('claimed');
    else if (step === 'reveal' || step === 'spinning') snooze('spun');
    else snooze('dismissed');
    setOpen(false);
  }

  // ------------------------------------------------------------------ spin --

  async function spin() {
    if (step !== 'idle') return;
    setError(null);
    setStep('spinning');

    let drawn: { wedge: number; token: string };
    try {
      const res = await fetch('/api/spin', { method: 'POST' });
      if (!res.ok) throw new Error(String(res.status));
      drawn = (await res.json()) as { wedge: number; token: string };
    } catch {
      setStep('idle');
      setError('The wheel jammed. Give it another go.');
      return;
    }

    if (!Number.isInteger(drawn.wedge) || drawn.wedge < 0 || drawn.wedge >= WEDGES.length) {
      // The prize table changed since this bundle was cached — animating to a
      // wedge that isn't there would land the pointer on the wrong offer.
      setStep('idle');
      setError('The wheel just changed. Refresh and try again.');
      return;
    }

    setToken(drawn.token);

    const jitter = (Math.random() - 0.5) * 20; // ±10°, well inside a 45° wedge
    const target = -(drawn.wedge * SLICE + SLICE / 2) + jitter;
    const base = rotationRef.current - (rotationRef.current % 360);
    const final = base + TURNS * 360 + target;

    if (reducedMotion.current) {
      setSpinTransition('none');
      setRotation(final);
      rotationRef.current = final;
      later(() => {
        setWedgeIndex(drawn.wedge);
        setStep('reveal');
      }, 350);
      return;
    }

    // Two phases: a long decelerating spin that overshoots by a few degrees,
    // then a short rock back onto the peg. One phase alone stops dead, which
    // reads as scripted — because it is.
    setSpinTransition(`transform ${SPIN_MS}ms cubic-bezier(0.16, 0.84, 0.16, 1)`);
    setRotation(final + OVERSHOOT);
    rotationRef.current = final;

    later(() => {
      setSpinTransition(`transform ${SETTLE_MS}ms cubic-bezier(0.34, 1.4, 0.64, 1)`);
      setRotation(final);
    }, SPIN_MS);

    later(() => {
      setWedgeIndex(drawn.wedge);
      setStep('reveal');
    }, SPIN_MS + SETTLE_MS);
  }

  // ----------------------------------------------------------------- claim --

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!token || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/spin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        expiresAt?: string | null;
        emailed?: boolean;
        terms?: string;
        prizeLabel?: string;
        prizeExit?: string;
        alreadyClaimed?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.code) {
        setError(data.error ?? 'That did not go through. Try once more?');
        setSending(false);
        return;
      }

      setClaim({
        code: data.code,
        expiresAt: data.expiresAt ?? null,
        emailed: data.emailed === true,
        terms: data.terms || (wedge?.terms ?? ''),
        prizeLabel: data.prizeLabel || (wedge?.label ?? ''),
        prizeExit: data.prizeExit || (wedge?.exit ?? ''),
        alreadyClaimed: data.alreadyClaimed === true,
      });
      setStep('success');
      snooze('claimed');
    } catch {
      setError('That did not go through. Try once more?');
    }

    setSending(false);
  }

  async function copyCode() {
    if (!claim) return;
    try {
      await navigator.clipboard.writeText(claim.code);
      setCopied(true);
      later(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the code is on screen and selectable anyway */
    }
  }

  if (!open) return null;

  const expiryLabel = claim?.expiresAt
    ? new Date(claim.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : `${CODE_VALID_DAYS} days`;

  // ------------------------------------------------------------------ view --

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop — navy with the brand speckle, so even the scrim is Townies. */}
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-town-navy/85 backdrop-blur-[3px]"
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: 'url(/brand/patterns/speckle-cream.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '130px',
          }}
        />
      </button>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotary-title"
        tabIndex={-1}
        className="relative w-full max-w-[25rem] max-h-[92dvh] overflow-y-auto rounded-sm bg-town-cream shadow-[0_36px_90px_-24px_rgba(13,27,42,0.75)] outline-none animate-[rotary-in_.34s_cubic-bezier(0.22,1,0.36,1)]"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-sm text-town-cream/70 transition-colors hover:bg-white/10 hover:text-town-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-town-cream"
        >
          <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden>
            <path d="M1 1 L13 13 M13 1 L1 13" stroke="currentColor" strokeWidth="1.8" fill="none" />
          </svg>
        </button>

        {/* Masthead — the navy sign board the rotary hangs off */}
        <header className="relative overflow-hidden bg-town-navy px-6 pt-7 pb-6 text-center">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'url(/brand/patterns/topo-cream.svg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '200px',
            }}
          />
          <div className="relative">
            <p className="font-block text-[0.6rem] uppercase tracking-[0.34em] text-town-cream/55">
              {step === 'success' ? claim?.prizeExit : step === 'reveal' ? wedge?.exit : 'Townies · Massachusetts'}
            </p>

            {step === 'success' ? (
              <h2 id="rotary-title" className="mt-2 font-block text-3xl uppercase leading-none text-white">
                {claim?.alreadyClaimed
                  ? 'You already took it.'
                  : claim?.emailed
                    ? 'Check your inbox.'
                    : 'Write this down.'}
              </h2>
            ) : step === 'reveal' ? (
              <h2 id="rotary-title" className="mt-2 font-block text-4xl uppercase leading-none text-white">
                {wedge?.label}
              </h2>
            ) : (
              <h2 id="rotary-title" className="mt-1 font-script text-5xl leading-[1.05] text-white">
                Take the rotary.
              </h2>
            )}

            <p className="mx-auto mt-3 max-w-[19rem] text-[0.8125rem] leading-relaxed text-town-cream/75">
              {step === 'idle' &&
                'Every exit wins something. Give it a spin and see where you come out.'}
              {step === 'spinning' && 'Signalling…'}
              {step === 'reveal' && 'That exit is yours. Tell us where to send the code.'}
              {step === 'success' &&
                (claim?.alreadyClaimed
                  ? `This address already came off the rotary at ${claim.prizeExit}. Here is that code again — one to a customer.`
                  : claim?.emailed
                    ? 'Your code is on its way — it is in your inbox in a minute or two.'
                    : 'The email did not go out, but the code below is live and it is yours.')}
            </p>
          </div>
        </header>

        {/* The rotary */}
        {step !== 'success' && (
          <div className="flex justify-center px-6 pt-6 pb-1">
            <div className="relative aspect-square w-full max-w-[19rem]">
              {/* Rotating layer */}
              <svg
                viewBox={`0 0 ${VB} ${VB}`}
                className="h-full w-full"
                aria-hidden
                style={{ transform: `rotate(${rotation}deg)`, transition: spinTransition }}
              >
                {/* Asphalt */}
                <circle cx={C} cy={C} r={R_DISC} fill={WEDGE_COLORS.navy} />

                {/* Exits. Fills first, then every label — so a wedge can never
                    paint over the neighbour whose text overhangs it. */}
                {WEDGES.map((w, i) => (
                  <path
                    key={w.id}
                    d={wedgePath(i)}
                    fill={WEDGE_COLORS[w.fill]}
                    stroke={WEDGE_COLORS.cream}
                    strokeWidth="2"
                  />
                ))}

                {/* Labels ride the wheel: drawn horizontally at the top of a
                    group that is then rotated onto its wedge, which is what
                    makes them read outward along the radius.

                    Wedges that end up on the LOWER half get a further 180
                    degrees and are placed on the opposite side of the centre —
                    the same physical spot, but the right way up.

                    "Lower half" is measured against the wheel's CURRENT
                    rotation, not its resting angle. Deciding it statically
                    looks right until the first spin, after which the wheel has
                    turned and half the labels are upside down again. Because
                    `rotation` jumps to its final value the instant the spin
                    starts and the CSS transition does the travelling, every
                    label is already oriented for where it is going to stop. */}
                {WEDGES.map((w, i) => {
                  const mid = i * SLICE + SLICE / 2;
                  const settled = (((mid + rotation) % 360) + 360) % 360;
                  const flipped = settled > 90 && settled < 270;
                  const dir = flipped ? 1 : -1;
                  return (
                    <g
                      key={`${w.id}-label`}
                      transform={`rotate(${flipped ? mid + 180 : mid} ${C} ${C})`}
                    >
                      <text
                        x={C}
                        y={C + dir * 128}
                        textAnchor="middle"
                        className="font-block"
                        fill={WEDGE_INK[w.fill]}
                        fillOpacity="0.72"
                        fontSize="10"
                        letterSpacing="1.8"
                      >
                        {w.exit.toUpperCase()}
                      </text>
                      <text
                        x={C}
                        y={C + dir * 106}
                        textAnchor="middle"
                        className="font-block"
                        fill={WEDGE_INK[w.fill]}
                        fontSize={labelSize(w.label)}
                        fontWeight="700"
                      >
                        {w.label}
                      </text>
                    </g>
                  );
                })}

                {/* Bollards on the exit lines */}
                {WEDGES.map((w, i) => {
                  const { x, y } = polar(R_PEG, i * SLICE);
                  return (
                    <circle
                      key={`${w.id}-peg`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={WEDGE_COLORS.cream}
                      fillOpacity="0.9"
                    />
                  );
                })}

                {/* Lane markings — they only read as a road once they move */}
                <circle
                  cx={C}
                  cy={C}
                  r={R_LANE}
                  fill="none"
                  stroke={WEDGE_COLORS.cream}
                  strokeOpacity="0.5"
                  strokeWidth="3"
                  strokeDasharray="16 14"
                  strokeLinecap="butt"
                />

                {/* Winner wash, once it has stopped */}
                {step === 'reveal' && wedgeIndex !== null && (
                  <path
                    d={wedgePath(wedgeIndex)}
                    fill={WEDGES[wedgeIndex].fill === 'cream' ? WEDGE_COLORS.navy : WEDGE_COLORS.cream}
                    stroke={WEDGE_COLORS.cream}
                    strokeWidth="3"
                    /* Presentation attribute, not a class: it is what the wash
                       falls back to when the glow keyframes are switched off
                       for reduced motion. Without it the wash renders opaque
                       and hides the very wedge it is meant to highlight. */
                    opacity="0.15"
                    className="animate-[rotary-glow_1.5s_ease-in-out_infinite]"
                  />
                )}
              </svg>

              {/* Static layer: the island and the sign — neither turns with the road */}
              <svg
                viewBox={`0 0 ${VB} ${VB}`}
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden
              >
                <defs>
                  {/* Lifts the signpost off the wheel so it never looks printed
                      onto a wedge it happens to be sitting over. */}
                  <filter id="rotary-sign-shadow" x="-60%" y="-60%" width="220%" height="220%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0D1B2A" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Island */}
                <circle cx={C} cy={C} r={R_HUB} fill={WEDGE_COLORS.cream} />
                <circle cx={C} cy={C} r={R_HUB} fill="none" stroke={WEDGE_COLORS.navy} strokeWidth="2.5" />
                <circle cx={C} cy={C} r={R_HUB - 7} fill="none" stroke={WEDGE_COLORS.forest} strokeOpacity="0.3" strokeWidth="1.2" />
                <svg x={C - 33} y={C - 18} width="66" height="36" viewBox={MA_VIEWBOX} preserveAspectRatio="xMidYMid meet">
                  <path d={MA_PATH} fill={WEDGE_COLORS.forest} />
                </svg>

                {/* Signpost blade, pointing at the exit you're taking. Cream on
                    a navy outline so it stays legible over a navy wedge, a
                    forest one and the cream jackpot alike. */}
                <g
                  className={step === 'spinning' ? 'animate-[rotary-tick_.1s_linear_infinite_alternate]' : undefined}
                  style={{ transformOrigin: `${C}px 8px` }}
                  filter="url(#rotary-sign-shadow)"
                >
                  <path
                    d={`M ${C - 27} 3 L ${C + 27} 3 L ${C + 27} 26 L ${C} 42 L ${C - 27} 26 Z`}
                    fill={WEDGE_COLORS.cream}
                    stroke={WEDGE_COLORS.navy}
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  {/* Rivets, as on the brand sheet's signpost boards. */}
                  <circle cx={C - 14} cy={15} r="3" fill={WEDGE_COLORS.navy} />
                  <circle cx={C + 14} cy={15} r="3" fill={WEDGE_COLORS.navy} />
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 pb-6 pt-3">
          <p aria-live="polite" className="sr-only">
            {step === 'reveal' && wedge ? `You landed on ${wedge.exit}, ${wedge.label}.` : ''}
            {step === 'success' && claim ? `Your code is ${claim.code}.` : ''}
          </p>

          {error && (
            <p className="mb-3 rounded-sm border border-town-navy/15 bg-white px-3 py-2 text-center text-[0.8125rem] text-town-navy">
              {error}
            </p>
          )}

          {(step === 'idle' || step === 'spinning') && (
            <>
              <button
                type="button"
                onClick={spin}
                disabled={step === 'spinning'}
                className="w-full rounded-sm bg-town-forest px-6 py-4 font-block text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-town-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-town-forest disabled:opacity-60"
              >
                {step === 'spinning' ? 'Merging…' : 'Spin the rotary'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 w-full py-1 text-center text-xs text-town-muted transition-colors hover:text-town-navy"
              >
                No thanks — I know where I&rsquo;m going
              </button>
            </>
          )}

          {step === 'reveal' && (
            <form onSubmit={handleClaim} className="space-y-3">
              <label htmlFor="rotary-email" className="sr-only">
                Email address
              </label>
              <input
                ref={emailInputRef}
                id="rotary-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-sm border border-town-rule bg-white px-4 py-3.5 text-town-navy placeholder:text-town-stone focus:border-town-forest focus:outline-none focus:ring-2 focus:ring-town-forest/25"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-sm bg-town-forest px-6 py-4 font-block text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-town-forest/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-town-forest disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send my code'}
              </button>
              <p className="text-center text-[0.6875rem] leading-relaxed text-town-muted">
                One code, one use, {CODE_VALID_DAYS} days. No spam — the code, and the odd new town.
              </p>
            </form>
          )}

          {step === 'success' && claim && (
            <div className="space-y-4">
              <div className="rounded-sm border-2 border-dashed border-town-forest bg-white px-4 py-6 text-center">
                <p className="font-block text-[0.625rem] uppercase tracking-[0.3em] text-town-stone">
                  Your code
                </p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-[0.15em] text-town-navy break-all">
                  {claim.code}
                </p>
                <p className="mt-3 text-[0.75rem] text-town-muted">
                  {claim.terms} · good through {expiryLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="w-full rounded-sm border border-town-navy px-6 py-3 font-block text-xs uppercase tracking-[0.2em] text-town-navy transition-colors hover:bg-town-navy hover:text-town-cream"
              >
                {copied ? 'Copied' : 'Copy code'}
              </button>

              <a
                href="/shop"
                onClick={() => snooze('claimed')}
                className="block w-full rounded-sm bg-town-forest px-6 py-4 text-center font-block text-sm uppercase tracking-[0.22em] text-white transition-colors hover:bg-town-forest/90"
              >
                Pick your town
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
