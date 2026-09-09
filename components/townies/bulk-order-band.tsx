import Link from 'next/link';
import Image from 'next/image';
import { StepsBand } from './steps-band';

/**
 * The bulk-order push — a photograph of an actual order, and the three steps.
 *
 * It used to be a centred text block: eyebrow, headline, three numbered
 * steps, a button, on flat cream. Correct and forgettable. Bulk is the growth
 * bet, and the section that carries it should look like thirty hats, not like
 * a pricing FAQ. So: the order itself on the left, the mechanics on the right.
 *
 * The three steps stay. What stops a coach or an office manager is not "can I
 * order thirty of these", it is "how does that work when there's no bulk
 * button on the site" — answering that is what earns the click.
 *
 * Request-a-town keeps its subordinate line here: it lost its announcement-bar
 * link and its own closing band, and for a brand whose catalogue is decided by
 * what people ask for, the footer alone is too quiet.
 */
const STEPS = [
  { n: '01', title: 'Tell us the count', body: 'How many, which towns, and the date you need them by.' },
  { n: '02', title: 'We send a price', body: 'A real number and a real lead time, back inside two business days.' },
  { n: '03', title: 'Order by email', body: 'No account, no bulk checkout to fight with. We invoice you.' },
];

export function BulkOrderBand({
  imageSrc,
  imageAlt = 'A bulk order of Townies hats piled on the workbench',
}: {
  /**
   * The photograph of an actual bulk order. There isn't one yet — three
   * generated batches (Sept 2026) all had a defect somewhere, and the call was
   * to stop spending on it. Until a real one is shot, the band runs as the
   * text-only StepsBand; drop a file in and pass it here to switch.
   */
  imageSrc?: string;
  imageAlt?: string;
}) {
  if (!imageSrc) {
    return (
      <StepsBand
        eyebrow="Bulk orders"
        title="Buying for everybody?"
        body="Teams, companies, schools, fundraisers. Twenty-five hats or two hundred — same twill, same stitching, better price per hat."
        steps={STEPS}
        cta={{ href: '/wholesale', label: 'Get a bulk price' }}
        secondary={{ href: '/request-a-town', label: 'Just want one? Request your town' }}
      />
    );
  }

  return (
    <section className="bg-town-cream border-t border-town-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-town-navy">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="lg:max-w-xl">
            <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-forest mb-3">
              Bulk orders
            </p>
            <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-town-navy mb-4">
              Buying for everybody?
            </h2>
            <p className="text-sm leading-relaxed text-town-muted max-w-md">
              Teams, companies, schools, fundraisers. Twenty-five hats or two hundred — same twill,
              same stitching, better price per hat.
            </p>

            <ol className="mt-8 space-y-5 border-t border-town-rule pt-6">
              {STEPS.map((s) => (
                <li key={s.n} className="grid grid-cols-[2.5rem_1fr] gap-3 items-baseline">
                  <span className="font-block text-[0.625rem] tracking-[0.22em] text-town-muted">{s.n}</span>
                  <div>
                    <h3 className="font-block font-bold uppercase text-base leading-snug tracking-[0.02em] text-town-navy">
                      {s.title}
                    </h3>
                    <p className="text-[0.8125rem] leading-relaxed text-town-muted mt-0.5">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/wholesale"
                className="inline-flex items-center rounded-none bg-town-navy px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-cream transition-colors hover:bg-town-forest"
              >
                Get a bulk price
              </Link>
              <Link
                href="/request-a-town"
                className="text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-town-muted hover:text-town-navy transition-colors"
              >
                Just want one? Request your town
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
