'use client';

import Script from 'next/script';

// Replace BEHOLD_WIDGET_ID with the real Behold widget ID once provided
const BEHOLD_WIDGET_ID = 'BEHOLD_WIDGET_ID';

export function InstagramFeed() {
  return (
    <section className="py-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-brand-muted text-xs uppercase tracking-widest mb-3">follow along</p>
          <h2 className="font-display text-4xl sm:text-5xl text-brand-ink mb-4">
            spotted in the circle.
          </h2>
          <a
            href="https://instagram.com/goodkicksco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-rust hover:underline text-sm"
          >
            @goodkicksco ↗
          </a>
        </div>

        {BEHOLD_WIDGET_ID === 'BEHOLD_WIDGET_ID' ? (
          /* Placeholder shown until Behold widget ID is configured */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-brand-rule flex items-center justify-center text-brand-muted/40 text-xs"
              >
                @goodkicksco
              </div>
            ))}
          </div>
        ) : (
          <>
            <div id={`behold-widget-${BEHOLD_WIDGET_ID}`} />
            <Script
              src={`https://w.behold.so/widget.js`}
              strategy="lazyOnload"
            />
          </>
        )}
      </div>
    </section>
  );
}
