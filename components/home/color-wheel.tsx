'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORWAYS } from './colorways-data';

interface ColorWheelProps {
  size?: number;
  showLabel?: boolean;
  bgColor?: string;
}

export function ColorWheel({ size = 300, showLabel = true, bgColor = '#EFE8DA' }: ColorWheelProps) {
  const [selected, setSelected] = useState(0);
  const current = COLORWAYS[selected];
  const radius = size * 0.393;
  const ballSize = size * 0.62;

  function dotPosition(i: number) {
    const angle = (i / COLORWAYS.length) * 2 * Math.PI - Math.PI / 2;
    return {
      left: size / 2 + radius * Math.cos(angle),
      top:  size / 2 + radius * Math.sin(angle),
    };
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ball centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: ballSize, height: ballSize }}>
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
                  className="object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Color dots in a ring */}
        {COLORWAYS.map((colorway, i) => {
          const pos = dotPosition(i);
          const active = selected === i;
          const dotSize = active ? Math.round(size * 0.147) : Math.round(size * 0.107);
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
                width: dotSize,
                height: dotSize,
                backgroundColor: colorway.color,
                borderRadius: '50%',
                // ring-offset colour matches the section background
                outline: active ? `3px solid #1a1a2e` : 'none',
                outlineOffset: active ? '3px' : '0',
                boxShadow: active ? `0 0 0 3px ${bgColor}` : 'none',
              }}
              className={`transition-all duration-200 ${active ? 'shadow-lg' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
            />
          );
        })}
      </div>

      {showLabel && (
        <p className="font-display text-2xl text-brand-ink tracking-wide">{current.name}</p>
      )}
    </div>
  );
}
