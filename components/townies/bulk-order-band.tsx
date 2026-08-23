import Link from 'next/link';

/**
 * The bulk-order push.
 *
 * Plain cream ground, no pattern overlay — this section sits between a white
 * rail and the forest value band, and the page needs a quiet step between the
 * two rather than a third loud one.
 *
 * The three steps are the point. A closing CTA that only says "here is a thing,
 * click it" wastes a section; what actually stops a coach or an office manager
 * is not "can I order thirty of these", it is "how does that work when there's
 * no bulk button on the site". Answering that here is what earns the click.
 */

const STEPS = [
  { n: '01', title: 'Tell us the count', body: 'How many, which towns, and the date you need them by.' },
  { n: '02', title: 'We send a price', body: 'A real number and a real lead time, back inside two business days.' },
  { n: '03', title: 'Order by email', body: 'No account, no bulk checkout to fight with. We invoice you.' },
];

export function BulkOrderBand() {
  return (
    <section className="bg-town-cream border-t border-town-rule">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-forest mb-4">
          Bulk orders
        </p>
        <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-town-navy mb-4">
          Buying for everybody?
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-town-muted">
          Teams, companies, schools, fundraisers. Twenty-five hats or two hundred — same twill,
          same stitching, better price per hat.
        </p>

        <ol className="mx-auto mt-10 grid gap-8 sm:grid-cols-3 sm:gap-8 text-left">
          {STEPS.map((s) => (
            <li key={s.n}>
              <p className="font-block text-[0.625rem] tracking-[0.22em] text-town-stone mb-2">{s.n}</p>
              <h3 className="font-block font-bold uppercase text-base leading-snug tracking-[0.02em] text-town-navy mb-1.5">
                {s.title}
              </h3>
              <p className="text-[0.8125rem] leading-relaxed text-town-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-11 flex flex-col items-center gap-4">
          <Link
            href="/wholesale"
            className="inline-flex items-center rounded-none bg-town-navy px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-cream transition-colors hover:bg-town-forest"
          >
            Get a bulk price
          </Link>
          {/* Request-a-town lost its announcement-bar link and its own closing
              band, which left the footer as its only route in. For a brand whose
              catalogue is decided by what people ask for, that is too quiet — so
              it keeps a subordinate line here. */}
          <Link
            href="/request-a-town"
            className="text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-muted hover:text-town-navy transition-colors"
          >
            Just want one? Request your town
          </Link>
        </div>
      </div>
    </section>
  );
}
