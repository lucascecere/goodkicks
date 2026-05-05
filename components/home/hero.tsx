'use client';

import Link from 'next/link';
import { ColorWheel } from './color-wheel';

export function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center px-4 sm:px-8 py-16 bg-brand-cream">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl text-brand-ink leading-[0.95] tracking-tight">
            make the circle bigger.
          </h1>
          <p className="text-brand-muted text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
            hand-stitched foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 justify-center lg:justify-start">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-brand-rust text-white px-7 py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors"
            >
              shop the collection
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center text-brand-ink hover:text-brand-rust transition-colors font-medium py-3.5"
            >
              our story →
            </Link>
          </div>
        </div>

        {/* Right: interactive color wheel */}
        <div className="flex items-center justify-center">
          <div className="lg:hidden">
            <ColorWheel size={250} showLabel bgColor="#F5EFE3" />
          </div>
          <div className="hidden lg:block">
            <ColorWheel size={360} showLabel bgColor="#F5EFE3" />
          </div>
        </div>
      </div>
    </section>
  );
}
