'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const COLORWAYS = [
  { name: 'georgia',    color: '#C15A3A', image: '/brand/ball_tennessee.png'  },
  { name: 'nevada',     color: '#D4A84B', image: '/brand/ball_newmexico.png'  },
  { name: 'colorado',   color: '#5BA4B4', image: '/brand/ball_montana.png'    },
  { name: 'new york',   color: '#A89870', image: '/brand/ball_newyork.png'    },
  { name: 'california', color: '#4A4848', image: '/brand/ball_california.png' },
  { name: 'maine',      color: '#5A5E68', image: '/brand/ball_maine.png'      },
];

const CONTAINER = 300;
const RADIUS = 118;

function dotPosition(i: number, total: number) {
  const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: CONTAINER / 2 + RADIUS * Math.cos(angle),
    top:  CONTAINER / 2 + RADIUS * Math.sin(angle),
  };
}

export function FeaturedProduct() {
  const [selected, setSelected] = useState(0);
  const current = COLORWAYS[selected];

  return (
    <section id="featured" className="py-20 px-4 sm:px-8 bg-[#EFE8DA]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Color wheel + ball */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative" style={{ width: CONTAINER, height: CONTAINER }}>

              {/* Ball in the center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-44 h-44">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selected}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={current.image}
                        alt={`Good Kicks ${current.name} colorway`}
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Dots arranged in a ring */}
              {COLORWAYS.map((colorway, i) => {
                const pos = dotPosition(i, COLORWAYS.length);
                const active = selected === i;
                return (
                  <button
                    key={colorway.name}
                    onClick={() => setSelected(i)}
                    aria-label={`Select ${colorway.name} colorway`}
                    style={{
                      position: 'absolute',
                      left: pos.left,
                      top: pos.top,
                      transform: 'translate(-50%, -50%)',
                      width: active ? 44 : 32,
                      height: active ? 44 : 32,
                      backgroundColor: colorway.color,
                      borderRadius: '50%',
                    }}
                    className={`transition-all duration-200 ${
                      active
                        ? 'ring-[3px] ring-offset-[3px] ring-brand-ink ring-offset-[#EFE8DA] shadow-lg'
                        : 'opacity-60 hover:opacity-100 hover:scale-110'
                    }`}
                  />
                );
              })}
            </div>

            {/* Active state name */}
            <p className="font-display text-2xl text-brand-ink capitalize tracking-wide">{current.name}</p>
          </div>

          {/* Copy */}
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium max-w-none">the good kick</p>
            <h2 className="font-display text-4xl sm:text-5xl text-brand-ink leading-tight">
              hand-stitched.<br />properly weighted.<br />$18.
            </h2>
            <p className="text-brand-muted leading-relaxed">
              six colorways. one circle. pick your state and keep the game going — hand-crocheted by the same crew that&apos;s been doing it for 30+ years.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-brand-rust text-white px-8 py-4 rounded font-medium text-lg hover:bg-brand-rust/90 transition-colors"
            >
              shop all colorways →
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
