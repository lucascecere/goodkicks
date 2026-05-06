import Link from 'next/link';

const perks = [
  { label: 'your own code', desc: 'custom code that gives your followers 20% off — tied to your school or account.' },
  { label: '8–10% commission', desc: 'earn on every order placed through your code. paid out monthly.' },
  { label: 'free starter pack', desc: 'a 3-pack shipped to you on approval.' },
];

export function AmbassadorPromo() {
  return (
    <section className="py-20 px-6 sm:px-8 bg-[#EFE8DA]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: copy */}
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-rust font-medium max-w-none">ambassador program</p>
            <h2 className="font-display text-4xl sm:text-5xl text-brand-ink leading-tight">
              run a school sack account?<br />we&apos;ll back you.
            </h2>
            <p className="text-brand-muted leading-relaxed max-w-md mx-auto lg:mx-0">
              we partner with high school and college hacky sack accounts — give your followers 20% off with your own code, pay you 8–10% commission on every sale, and ship you a free starter pack to kick things off.
            </p>
            <Link
              href="/ambassadors"
              className="inline-block bg-brand-rust text-white px-7 py-3.5 rounded font-medium hover:bg-brand-rust/90 transition-colors"
            >
              apply to be an ambassador →
            </Link>
          </div>

          {/* Right: perks */}
          <div className="space-y-4">
            {perks.map((perk, i) => (
              <div key={perk.label} className="flex items-start gap-5 bg-[#1A1A1A] rounded-xl p-5">
                <span className="font-display text-3xl text-brand-rust/60 flex-shrink-0 leading-none">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="font-medium text-white text-sm">{perk.label}</p>
                  <p className="text-white/50 text-sm mt-0.5">{perk.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-brand-muted/50 text-xs text-center lg:text-left pt-2">
              high school · college · freestyle · all welcome
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
