import Link from 'next/link';

/**
 * A quiet, three-step explainer with one CTA — the "how does that actually
 * work" section that stops somebody who has a job to do (order thirty hats,
 * run a sack account) and wants to know the mechanics before they click.
 *
 * Plain `bg` ground, no pattern: it sits between a white rail and the brand's
 * full-colour band, and the page needs a quiet step between the two rather
 * than a third loud one.
 *
 * Shared by both brands. Townies wraps it as BulkOrderBand; Good Kicks as the
 * ambassador-program section.
 */
export type Step = { n: string; title: string; body: string };

export function StepsBand({
  id,
  eyebrow,
  title,
  body,
  steps,
  cta,
  secondary,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  steps: Step[];
  cta: { href: string; label: string };
  /** A subordinate text link under the button. */
  secondary?: { href: string; label: string };
}) {
  return (
    <section id={id} className="scroll-mt-24 bg-bg border-t border-rule">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-accent mb-4">
          {eyebrow}
        </p>
        <h2 className="heading text-2xl sm:text-3xl leading-none text-text mb-4">{title}</h2>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">{body}</p>

        <ol className="mx-auto mt-10 grid gap-8 sm:grid-cols-3 sm:gap-8 text-left">
          {steps.map((s) => (
            <li key={s.n}>
              {/* `muted`, not `stone`: stone on cream is 2.8:1 and every scan
                  flagged these numerals. */}
              <p className="font-heading text-[0.625rem] tracking-[0.22em] text-muted mb-2">{s.n}</p>
              <h3 className="heading text-base leading-snug text-text mb-1.5">{s.title}</h3>
              <p className="text-[0.8125rem] leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-11 flex flex-col items-center gap-4">
          <Link
            href={cta.href}
            className="inline-flex items-center rounded-none bg-ink px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-contrast transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            {cta.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-muted hover:text-text transition-colors"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
