'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The review box.
 *
 * Deliberately short: a rating, what they thought, a name to credit and an
 * optional town. Every extra field is somebody deciding not to bother.
 *
 * The rating is a real radio group, not five click handlers — it has to be
 * reachable by keyboard, and a screen reader has to be able to say what was
 * picked.
 */
export function ReviewForm({
  token,
  brand = 'townies',
  productTitle,
}: {
  token?: string;
  brand?: 'townies' | 'goodkicks';
  productTitle?: string | null;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          quote: form.get('quote'),
          name: form.get('name'),
          town: form.get('town'),
          email: form.get('email'),
          website: form.get('website'), // honeypot
          token,
          brand,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? 'Something went wrong.');
        setState('idle');
        return;
      }
      setState('done');
    } catch {
      setError('Could not reach the server. Try again in a minute.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="border border-rule bg-surface p-8 text-center">
        <p className="heading text-2xl text-text">Thank you.</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We read every one. If it's going on the site you'll see it there shortly.
        </p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form onSubmit={onSubmit} className="border border-rule bg-surface p-6 sm:p-8">
      {productTitle && (
        <p className="mb-6 text-[0.6875rem] uppercase tracking-[0.18em] text-accent">
          {productTitle}
        </p>
      )}

      <fieldset className="border-0 p-0 m-0">
        <legend className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
          How many stars?
        </legend>
        <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              onMouseEnter={() => setHover(n)}
              className="cursor-pointer p-1 focus-within:outline focus-within:outline-2 focus-within:outline-accent"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
              />
              <span className="sr-only">{n} star{n === 1 ? '' : 's'}</span>
              <Star
                size={30}
                aria-hidden
                className={cn(
                  'transition-colors',
                  n <= shown ? 'fill-accent text-accent' : 'fill-none text-rule',
                )}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-7 block">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
          What did you think?
        </span>
        <textarea
          name="quote"
          required
          rows={5}
          maxLength={1200}
          placeholder="Fit, quality, how it wears — whatever you'd tell a friend."
          className="mt-2 w-full border border-rule bg-bg p-3 text-sm text-text placeholder:text-stone focus:border-accent focus:outline-none"
        />
      </label>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
            Name
          </span>
          {/* First name + last initial is how these get shown, so ask for that
              rather than trimming a full name down afterwards. */}
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Dan M."
            className="mt-2 w-full border border-rule bg-bg p-3 text-sm text-text placeholder:text-stone focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
            Town <span className="font-normal normal-case tracking-normal text-muted">(optional)</span>
          </span>
          <input
            name="town"
            maxLength={60}
            placeholder="Milton, MA"
            className="mt-2 w-full border border-rule bg-bg p-3 text-sm text-text placeholder:text-stone focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      {/* Only asked when there's no order behind the link. Never published. */}
      {!token && (
        <label className="mt-5 block">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text">
            Email <span className="font-normal normal-case tracking-normal text-muted">(optional, never shown)</span>
          </span>
          <input
            name="email"
            type="email"
            maxLength={160}
            placeholder="so we can reply if something's wrong"
            className="mt-2 w-full border border-rule bg-bg p-3 text-sm text-text placeholder:text-stone focus:border-accent focus:outline-none"
          />
        </label>
      )}

      {/* Honeypot — off-screen, not display:none, which bots skip. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error && <p className="mt-5 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={state === 'sending' || rating === 0}
        className="mt-7 w-full bg-text px-6 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-bg transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {state === 'sending' ? 'Sending…' : rating === 0 ? 'Pick a rating first' : 'Send it'}
      </button>
    </form>
  );
}
