'use client';

import { useState, useEffect } from 'react';

/**
 * Cross-fading background slideshow for the hero. Purely the background layer —
 * the hero's gradient, copy, and logo sit above it unchanged. Auto-advances on
 * an interval; respects a single image (no cycling) and does nothing fancy on
 * the first paint so the LCP image loads eagerly.
 */
export function HeroSlider({
  slides,
  interval = 5000,
}: {
  slides: string[];
  interval?: number;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);

  return (
    <div className="absolute inset-0">
      {slides.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : 'auto'}
          className="absolute inset-0 h-full w-full object-cover object-[center_60%] transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
