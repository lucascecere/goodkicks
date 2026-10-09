'use client';

import { useState } from 'react';

const input =
  'w-full border border-rule bg-white px-3 py-2.5 text-[0.9375rem] text-text placeholder:text-stone focus:border-text focus:outline-none';
const label = 'mb-1.5 block font-label text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted';

export function ApplyForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch('/api/shop/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'Could not send. Try again.');
      setState('idle');
      return;
    }
    setState('done');
  }

  if (state === 'done') {
    return (
      <div className="border border-rule p-8">
        <p className="display text-2xl text-text">Got it. Thanks.</p>
        <p className="mt-3 text-muted">We read every application and reply by email within a few days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={label} htmlFor="name">Business name *</label>
        <input id="name" name="name" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="town">Town *</label>
        <input id="town" name="town" required className={input} placeholder="Milton" />
      </div>
      <div>
        <label className={label} htmlFor="contact_name">Your name *</label>
        <input id="contact_name" name="contact_name" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="contact_email">Email *</label>
        <input id="contact_email" name="contact_email" type="email" required className={input} />
      </div>
      <div>
        <label className={label} htmlFor="contact_phone">Phone</label>
        <input id="contact_phone" name="contact_phone" className={input} />
      </div>
      <div>
        <label className={label} htmlFor="website">Website or Instagram</label>
        <input id="website" name="website" className={input} placeholder="yourshop.com or @yourshop" />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="about">Tell us about your business *</label>
        <textarea id="about" name="about" required minLength={10} rows={5} className={input} placeholder="What you do, how long you've been in town, and what kind of hat you have in mind." />
      </div>
      <div className="sm:col-span-2">
        <span className={label}>Do you have a logo file?</span>
        <div className="flex flex-wrap gap-4 text-[0.9375rem] text-text">
          {[
            ['yes', 'Yes'],
            ['no', 'No, we need one'],
            ['not_sure', 'Not sure'],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" name="has_logo" value={v} defaultChecked={v === 'yes'} /> {l}
            </label>
          ))}
        </div>
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="bg-accent px-6 py-4 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast disabled:opacity-50"
        >
          {state === 'sending' ? 'Sending…' : 'Apply for a stall'}
        </button>
      </div>
    </form>
  );
}
