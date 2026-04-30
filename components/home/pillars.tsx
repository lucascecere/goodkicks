import { Scissors, CircleDollarSign, Users } from 'lucide-react';

const pillars = [
  {
    icon: Scissors,
    title: 'Built right.',
    body: "hand-stitched panels, weighted right, soft enough to control. made by the same crew that's been making them for 30+ years.",
  },
  {
    icon: CircleDollarSign,
    title: 'Priced for the squad.',
    body: '$15. no premium tax, no $4 amazon junk. just the right one at the right price.',
  },
  {
    icon: Users,
    title: 'Made for the circle.',
    body: 'we back the school accounts, the friend-group crews, the people keeping the scene going.',
  },
];

// Tripled so the marquee loop is seamless with only 3 items
const marqueeItems = [...pillars, ...pillars, ...pillars];

export function Pillars() {
  return (
    <section className="py-8">
      {/* Color strip decoration */}
      <div className="flex w-full mb-8 overflow-hidden rounded-full h-1.5 max-w-xs mx-auto gap-1 px-4 sm:px-8">
        <div className="flex-1 bg-brand-rust rounded-full" />
        <div className="flex-1 bg-brand-blue rounded-full" />
        <div className="flex-1 bg-brand-green rounded-full" />
      </div>

      {/* Mobile: marquee */}
      <div className="md:hidden overflow-hidden">
        <div
          className="flex gap-6"
          style={{
            width: 'max-content',
            animation: 'marquee 18s linear infinite',
          }}
        >
          {marqueeItems.map((pillar, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2 w-64 flex-shrink-0 px-2">
              <pillar.icon className="text-brand-rust" size={24} strokeWidth={1.5} />
              <h3 className="font-display text-xl text-brand-ink">{pillar.title}</h3>
              <p className="text-brand-muted text-sm leading-relaxed">{pillar.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid max-w-7xl mx-auto px-8 grid-cols-3 gap-10">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="space-y-3 flex flex-col items-start text-left">
            <pillar.icon className="text-brand-rust" size={28} strokeWidth={1.5} />
            <h3 className="font-display text-2xl text-brand-ink">{pillar.title}</h3>
            <p className="text-brand-muted leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
