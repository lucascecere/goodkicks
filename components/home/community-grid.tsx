'use client';

const colorways = [
  {
    name: 'georgia',
    style: { background: '#C15A3A' },
  },
  {
    name: 'colorado',
    style: {
      background: 'linear-gradient(135deg, #C15A3A 50%, #4A4848 50%)',
    },
  },
  {
    name: 'nevada',
    style: { background: '#A89870' },
  },
  {
    name: 'new york',
    style: {
      background: 'linear-gradient(135deg, #4A4848 50%, #D4A84B 50%)',
    },
  },
  {
    name: 'california',
    style: { background: '#5BA4B4' },
  },
  {
    name: 'maine',
    style: { background: '#5A5E68' },
  },
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
              <div
                className="w-44 h-44 rounded-full shadow-lg ring-1 ring-white/10"
                style={colorway.style}
              />
              <p className="font-display text-xl text-white/90 tracking-wide">{colorway.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
