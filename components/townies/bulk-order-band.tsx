import Link from 'next/link';
import { BrandPattern } from './brand-pattern';

/**
 * The closing band: bulk orders.
 *
 * It replaced the request-a-town CTA in this slot, and it is deliberately not
 * the same shape. A closing band that only says "here is a thing, click it" is
 * a wasted section — the three steps do the actual work, because the question
 * stopping a coach or an office manager is never "can I order thirty of these",
 * it is "how does that even work if there's no bulk button". Answering that on
 * the homepage is what earns the click through to the form.
 *
 * Pattern is `ma` rather than the pine used by RequestTownBand, so the two
 * closing bands don't read as the same section on the pages that carry both.
 */

const STEPS = [
  { n: '01', title: 'Tell us the count', body: 'How many, which towns, and when you need them by.' },
  { n: '02', title: 'We price it', body: 'A real number and a realistic lead time, back within two business days.' },
  { n: '03', title: 'Order over email', body: 'No account, no bulk checkout to fight with. We invoice you.' },
];

export function BulkOrderBand() {
  return (
    <section className="relative overflow-hidden bg-town-forest">
      <BrandPattern variant="ma" color="cream" opacity={0.07} size={150} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-4">
          Bulk &amp; wholesale
        </p>
        <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-white mb-4">
          Twenty-five hats or two hundred.
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-town-cream/85">
          Teams, companies, schools, fundraisers, weddings. Same hats, same stitching — just a lot
          more of them, and a price that reflects it.
        </p>

        <ol className="mx-auto mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6 text-left">
          {STEPS.map((s) => (
            <li key={s.n}>
              <p className="font-block text-[0.625rem] tracking-[0.22em] text-town-cream/50 mb-2">
                {s.n}
              </p>
              <h3 className="font-block font-bold uppercase text-base leading-snug tracking-[0.02em] text-white mb-1.5">
                {s.title}
              </h3>
              <p className="text-[0.8125rem] leading-relaxed text-town-cream/70">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-11 flex flex-col items-center gap-4">
          <Link
            href="/wholesale"
            className="inline-flex items-center rounded-none bg-town-cream px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-navy transition-colors hover:bg-white"
          >
            Start a bulk order
          </Link>
          {/* Request-a-town lost its announcement-bar link and its own closing
              band, which left the footer as its only route in. For a brand whose
              catalogue is decided by what people ask for, that is too quiet — so
              it keeps a subordinate line here. */}
          <Link
            href="/request-a-town"
            className="text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-cream/70 hover:text-white transition-colors"
          >
            Just want one? Request your town
          </Link>
        </div>
      </div>
    </section>
  );
}
