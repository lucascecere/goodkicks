const STEPS = [
  { n: '01', title: 'Build a mockup.', body: 'Pick the hat and colors, drop your logo on the front. It takes a couple of minutes.' },
  { n: '02', title: 'We send a price.', body: 'Within two business days, for the quantity you asked about.' },
  { n: '03', title: 'Approve and we embroider.', body: 'Nothing is made until you say yes. Then your logo goes on the hats.' },
];

/** Three-step strip between the builder and the details form. */
export function HowItWorks() {
  return (
    <section className="bg-text text-white">
      <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-14">
        <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-white/60">How it works</p>
        <ol className="mt-6 grid gap-8 sm:grid-cols-3 sm:gap-10">
          {STEPS.map((s) => (
            <li key={s.n} className="border-t border-white/20 pt-5">
              <span className="font-label text-[0.75rem] font-semibold tracking-[0.16em] text-[#9FB8A6]">{s.n}</span>
              <h3 className="display mt-2 text-[1.75rem]">{s.title}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-white/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
