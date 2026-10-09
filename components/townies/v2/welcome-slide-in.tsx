'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';

/**
 * Mass trivia (Lucas, 2026-10-07): a full centred pop-up that opens at 60%
 * scroll on a first page, or on a later page at 50% scroll or 12s, whichever
 * comes first (no exit-intent). Never auto-opens on product pages. Two
 * crazy-easy questions; the score picks the prize, and
 * everyone wins at least $5 off. Graded on the server (/api/quiz/grade), the
 * code is minted through the same /api/spin/claim path as the old rotary.
 */
const KEY = 'townies_welcome_v1';
type Q = { id: string; q: string; options: string[] };
type Graded = { score: number; correct: Record<string, boolean>; prize: { label: string; terms: string }; token: string };
const SNOOZE_DAYS = { dismissed: 14, claimed: 365 } as const;
const VIEWS = 'townies_welcome_views';
const BLOCKED = ['/admin', '/checkout', '/cart', '/goodkicks', '/stick'];
/** Never auto-open over a product page: it covers the buy box (2026-10-08 audit).
 *  /shop has its own Hat & Sack pop-up (10-09), so trivia stays off it too. */
const NO_AUTO_OPEN = ['/products/', '/shop'];
/** Second-view trigger: half the page scrolled, or this long on it, whichever is first. */
const SECOND_VIEW_SCROLL = 0.5;
const SECOND_VIEW_MS = 12_000;

function snoozedUntil(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw).until as number) ?? 0 : 0;
  } catch {
    return 0;
  }
}
function snooze(reason: keyof typeof SNOOZE_DAYS) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + SNOOZE_DAYS[reason] * 864e5, reason }));
  } catch {}
}

export function WelcomeSlideIn() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'quiz' | 'result' | 'done'>('intro');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [graded, setGraded] = useState<Graded | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; emailed: boolean; alreadyClaimed: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (BLOCKED.some((p) => pathname.startsWith(p))) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === '0') return snooze('dismissed');
    if (params.get('welcome') !== '1' && snoozedUntil() > Date.now()) return;

    let views = 0;
    try {
      views = Number(sessionStorage.getItem(VIEWS) ?? 0) + 1;
      sessionStorage.setItem(VIEWS, String(views));
    } catch {}
    if (params.get('welcome') === '1') {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
    // Product pages still count as a view, they just never open it.
    if (NO_AUTO_OPEN.some((p) => pathname.startsWith(p))) return;
    const second = views >= 2;
    const threshold = second ? SECOND_VIEW_SCROLL : 0.6;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setOpen(true);
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      const h = document.documentElement;
      if ((h.scrollTop + h.clientHeight) / h.scrollHeight >= threshold) show();
    };
    if (second) timer = setTimeout(show, SECOND_VIEW_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  function close() {
    setOpen(false);
    if (step !== 'done') snooze('dismissed');
  }

  async function start() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/quiz/start').then((x) => x.json());
      setQuestions(r.questions);
      setI(0);
      setPicks({});
      setStep('quiz');
    } catch {
      setError('Couldn’t load the questions. Try again in a minute.');
    }
    setBusy(false);
  }

  async function choose(option: string) {
    if (picked) return;
    const q = questions[i];
    const next = { ...picks, [q.id]: option };
    setPicked(option);
    setPicks(next);
    // A short beat on the chosen answer, then the next question.
    await new Promise((r) => setTimeout(r, 450));
    setPicked(null);
    if (i + 1 < questions.length) return setI(i + 1);
    setBusy(true);
    try {
      const res = await fetch('/api/quiz/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: next }),
      });
      const g = await res.json();
      if (!res.ok) throw new Error(g.error);
      setGraded(g);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Try again in a minute.');
    }
    setBusy(false);
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    if (!graded) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/spin/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: graded.token, email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Try again in a minute.');
      setResult({ code: body.code, emailed: body.emailed, alreadyClaimed: body.alreadyClaimed });
      setStep('done');
      snooze('claimed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try again in a minute.');
    }
    setBusy(false);
  }

  // Escape closes, and the page behind doesn't scroll while the pop-up is up.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const q = questions[i];
  const label = 'font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60';
  const primary = 'font-label bg-text px-5 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-black disabled:opacity-60';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Full pop-up (Lucas, 10-07): a centred card over a dimmed page. */}
      <button aria-label="Close" onClick={close} className="absolute inset-0 animate-[fade-in_.3s_ease-out_both] bg-[#0D1B2A]/60 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mass trivia"
        className="relative w-full max-w-[460px] animate-[pop-in_.35s_ease-out_both] overflow-hidden bg-white shadow-[0_30px_80px_-20px_rgba(13,27,42,0.6)]"
      >
        <div className="bg-[#0D1B2A] px-6 py-5 text-center sm:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logos/townies-script-natural.svg" alt="Townies" className="mx-auto h-10 w-auto" />
        </div>
        <button onClick={close} aria-label="Close" className="absolute right-3 top-3 p-1 text-white/70 hover:text-white">
          <X size={20} />
        </button>
        <div className="p-6 sm:p-8">

      {step === 'intro' && (
        <div>
          <p className={label}>Mass trivia</p>
          <p className="display mt-2 text-[2rem] leading-[1.05] text-text">Know your Mass? Win up to $10 off.</p>
          <p className="mt-2 text-[0.9375rem] text-text/70">Two easy questions. Everyone wins at least $5 off. Get both right for $10.</p>
          <div className="mt-4 flex items-center gap-4">
            <button onClick={start} disabled={busy} className={primary}>{busy ? '…' : 'Play'}</button>
            <button type="button" onClick={close} className="text-[0.8125rem] text-text/55 underline underline-offset-4 hover:text-text">Not now</button>
          </div>
        </div>
      )}

      {step === 'quiz' && q && (
        <div>
          <div className="flex items-center justify-between">
            <p className={label}>Question {i + 1} of {questions.length}</p>
            <div className="flex gap-1">
              {questions.map((x, k) => (
                <span key={x.id} className={`h-1 w-5 ${k <= i ? 'bg-text' : 'bg-rule'}`} />
              ))}
            </div>
          </div>
          <p className="display mt-3 text-[1.625rem] leading-snug text-text">{q.q}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {q.options.map((o) => (
              <button
                key={o}
                onClick={() => choose(o)}
                disabled={!!picked || busy}
                className={`border px-4 py-4 text-left text-[0.9375rem] font-medium transition-colors ${
                  picked === o ? 'border-text bg-text text-white' : 'border-rule text-text hover:border-text'
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'result' && graded && (
        <form onSubmit={claim}>
          <p className={label}>{graded.score} of {questions.length} right</p>
          <p className="display mt-2 text-[1.75rem] leading-tight text-text">
            {graded.score === questions.length ? 'Perfect. ' : graded.score === 1 ? 'Not bad. ' : 'Close enough. '}
            You won {graded.prize.terms.toLowerCase()}.
          </p>
          <p className="mt-2 text-[0.875rem] text-text/70">Where should we send the code?</p>
          <div className="mt-3 flex gap-2">
            <label htmlFor="quiz-email" className="sr-only">Email</label>
            <input
              id="quiz-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 border border-text/25 px-3 py-3 text-[1rem] text-text placeholder:text-text/40 focus:border-text focus:outline-none"
            />
            <button disabled={busy} className={primary}>{busy ? '…' : 'Send it'}</button>
          </div>
          <p className="mt-2 text-[0.75rem] text-text/50">One code per person. You’ll also hear when a new town drops.</p>
        </form>
      )}

      {step === 'done' && result && (
        <div>
          <p className={label}>{result.alreadyClaimed ? 'Already yours' : 'Nice work'}</p>
          <p className="display mt-2 text-[1.75rem] text-text">Your code: {result.code}</p>
          <p className="mt-2 text-[0.9375rem] text-text/70">
            {result.emailed ? 'We sent it to your inbox too. ' : ''}Enter it at checkout.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-[0.8125rem] text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
