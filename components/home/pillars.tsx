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
    body: 'no premium tax, no $4 amazon junk. just the right foot bag at the right price.',
  },
  {
    icon: Users,
    title: 'Made for the circle.',
    body: 'we back the school accounts, the friend-group crews, the people keeping the scene going.',
  },
];

export function Pillars() {
  return (
    <section className="py-20 px-4 sm:px-8">
      {/* Color strip decoration */}
      <div className="flex w-full mb-12 overflow-hidden rounded-full h-1.5 max-w-xs mx-auto gap-1">
        <div className="flex-1 bg-brand-rust rounded-full" />
        <div className="flex-1 bg-brand-blue rounded-full" />
        <div className="flex-1 bg-brand-green rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="space-y-3 flex flex-col items-center text-center md:items-start md:text-left">
            <pillar.icon className="text-brand-rust" size={28} strokeWidth={1.5} />
            <h3 className="font-display text-2xl text-brand-ink">{pillar.title}</h3>
            <p className="text-brand-muted leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
