'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="min-h-[90vh] flex items-center px-4 sm:px-8 py-16">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div className="space-y-6">
          <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl text-brand-ink leading-[0.95] tracking-tight">
            make the circle bigger.
          </h1>
          <p className="text-brand-muted text-lg leading-relaxed max-w-md">
            hand-stitched foot bags built for dorm circles, dining-hall tosses, and every backpack that needs one.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a
              href="#featured"
              className="inline-flex items-center justify-center bg-brand-rust text-white px-7 py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors"
            >
              shop the good kick
            </a>
            <Link
              href="/about"
              className="inline-flex items-center text-brand-ink hover:text-brand-rust transition-colors font-medium py-3.5"
            >
              our story →
            </Link>
          </div>
        </div>

        {/* Right: product image placeholder with bob animation */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-brand-rule flex items-center justify-center text-8xl">
            🏐
          </div>
        </motion.div>
      </div>
    </section>
  );
}
