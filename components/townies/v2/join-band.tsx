'use client';

import { useState } from 'react';

/** Melin's "Join the family": a centred line and one email field. */
export function JoinBand() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, brand: 'townies' }),
    }).catch(() => null);
    setState(res?.ok ? 'done' : 'error');
  }

  return (
    <section className="border-t border-rule bg-[#F1EEE8]">
      <div className="mx-auto max-w-xl px-4 py-14 text-center sm:py-20">
        <h2 className="display text-[2rem] sm:text-[2.5rem] text-text">New towns, first.</h2>
        <p className="mt-3 text-[1rem] text-text/70">Hear about the next drop before the group chat does.</p>
        {state === 'done' ? (
          <p className="mt-8 font-label text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-text">You’re on the list.</p>
        ) : (
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md gap-2">
            <label htmlFor="join-email" className="sr-only">Email</label>
            <input
              id="join-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="min-w-0 flex-1 border border-text/25 bg-white px-4 py-3.5 text-[1rem] text-text placeholder:text-text/40 focus:border-text focus:outline-none"
            />
            <button
              disabled={state === 'busy'}
              className="font-label bg-text px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-black disabled:opacity-60"
            >
              Sign up
            </button>
          </form>
        )}
        {state === 'error' && <p className="mt-3 text-[0.875rem] text-red-700">That didn’t go through. Try again in a minute.</p>}
      </div>
    </section>
  );
}
