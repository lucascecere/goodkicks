'use client';

import Image from 'next/image';

const colorways = [
  { name: 'georgia',    src: '/brand/ball_tennessee.png'  },
  { name: 'nevada',     src: '/brand/ball_newmexico.png'  },
  { name: 'colorado',   src: '/brand/ball_montana.png'    },
  { name: 'new york',   src: '/brand/ball_newyork.png'    },
  { name: 'massachusetts', src: '/brand/ball_massachusetts.png' },
  { name: 'maine',      src: '/brand/ball_maine.png'      },
];

// Doubled for seamless infinite loop
const doubled = [...colorways, ...colorways];

export function CommunityGrid() {
  return (
    <section className="py-20 bg-brand-ink text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-12 text-center">
        <h2 className="font-display text-4xl sm:text-5xl mb-4">the collection.</h2>
        <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
          six colorways. one circle. pick yours and keep the game going.
        </p>
      </div>

      {/* Marquee track — no px padding so it bleeds edge-to-edge */}
      <div className="relative">
        <div
          className="flex gap-6"
          style={{
            width: 'max-content',
            animation: 'marquee 48s linear infinite',
          }}
        >
          {doubled.map((colorway, i) => (
            <div key={i} className="flex flex-col items-center gap-4 w-52 flex-shrink-0">
              <div className="w-44 h-44 relative">
                <Image
                  src={colorway.src}
                  alt={`${colorway.name} colorway`}
                  fill
                  className="object-contain drop-shadow-lg"
                />
              </div>
              <p className="font-display text-xl text-white/90 tracking-wide">{colorway.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
