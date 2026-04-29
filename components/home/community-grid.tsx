const placeholderColors = [
  'bg-brand-rust/20',
  'bg-brand-blue/20',
  'bg-brand-green/20',
  'bg-brand-rule',
  'bg-brand-rust/10',
  'bg-brand-blue/10',
];

export function CommunityGrid() {
  return (
    <section className="py-20 px-4 sm:px-8 bg-brand-ink text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl sm:text-5xl mb-4">spotted in the wild.</h2>
          <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
            there&apos;s a quiet renaissance happening on college campuses — schools and friend groups running their own sac accounts. we&apos;re rooting for it.
          </p>
        </div>

        {/* Placeholder grid — TODO: replace with real UGC images after launch */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {placeholderColors.map((color, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg ${color} flex items-center justify-center text-4xl`}
            >
              🏐
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://instagram.com/goodkicks"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            tag us @goodkicks ↗
          </a>
        </div>
      </div>
    </section>
  );
}
