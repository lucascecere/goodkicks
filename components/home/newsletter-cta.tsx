'use client';

import { useState } from 'react';

export function NewsletterCta() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="py-20 px-4 sm:px-8 border-t border-brand-rule">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-4xl sm:text-5xl text-brand-ink">
          stay in the circle.
        </h2>
        <p className="text-brand-muted mt-4 leading-relaxed">
          new drops, campus stories, and whatever&apos;s going on with the sac.
        </p>

        {submitted ? (
          <p className="text-brand-muted text-sm mt-8">you&apos;re in the circle. ✌️</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              aria-label="Email address"
              className="flex-1 border border-brand-rule bg-white text-brand-ink placeholder:text-brand-muted/60 rounded px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-rust/30"
            />
            <button
              type="submit"
              className="bg-brand-rust text-white px-6 py-3 rounded font-medium hover:bg-brand-rust/90 transition-colors whitespace-nowrap"
            >
              i&apos;m in
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
