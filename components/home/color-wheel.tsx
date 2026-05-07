'use client';

import { useState } from 'react';
import Image from 'next/image';
import { COLORWAYS } from './colorways-data';

interface ColorWheelProps {
  size?: number;
  showLabel?: boolean;
  bgColor?: string;
}

export function ColorWheel({ size = 300, showLabel = true, bgColor = '#EFE8DA' }: ColorWheelProps) {
  const [selected, setSelected] = useState(0);
  const current = COLORWAYS[selected];

  // Increased radius so dots sit further from the ball edge
  const radius = size * 0.46;
  const ballSize = size * 0.58;

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

        {/* All ball images rendered at once — only selected is visible.
            This preloads every image so switching is instant with no flicker. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: ballSize, height: ballSize }}>
            {COLORWAYS.map((colorway, i) => (
              <div
                key={colorway.name}
                className="absolute inset-0"
                style={{
                  opacity: selected === i ? 1 : 0,
                  transition: 'opacity 0.18s ease-out',
                }}
              >
                <Image
                  src={colorway.image}
                  alt={`Good Kicks ${colorway.name} colorway`}
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            ))}
          </div>
        </div>

        {/* Color dots in a ring */}
        {COLORWAYS.map((colorway, i) => {
          const pos = dotPosition(i);
          const active = selected === i;
          const dotSize = active ? Math.round(size * 0.13) : Math.round(size * 0.095);
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
                outline: active ? `3px solid ${colorway.color}` : 'none',
                outlineOffset: active ? '3px' : '0',
                boxShadow: active ? `0 0 0 6px ${bgColor}` : 'none',
              }}
              className={`transition-all duration-200 ${active ? 'shadow-lg' : 'opacity-50 hover:opacity-90 hover:scale-110'}`}
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
