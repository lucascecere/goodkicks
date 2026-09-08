import Link from 'next/link';
import { BrandPattern, type PatternVariant } from './brand-pattern';

/**
 * Closing CTA on the brand's full-colour `band` ground.
 *
 * The page ends on the single most useful thing a visitor can do rather than
 * on a newsletter box. Townies wraps this as RequestTownBand (pine pattern);
 * Good Kicks runs it flat, since its brand has no tile set.
 */
export function ClosingBand({
  eyebrow,
  title,
  body,
  cta,
  secondary,
  pattern = 'none',
}: {
  eyebrow: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
  pattern?: PatternVariant | 'none';
}) {
  return (
    <section className="relative overflow-hidden bg-band">
      {pattern !== 'none' && <BrandPattern variant={pattern} color="cream" opacity={0.1} size={300} />}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center">
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-white/90 mb-4">
          {eyebrow}
        </p>
        <h2 className="heading text-2xl sm:text-3xl leading-none text-white mb-4">{title}</h2>
        <p className="text-white/90 leading-relaxed mb-9 mx-auto">{body}</p>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href={cta.href}
            className="inline-flex items-center bg-ink-contrast text-text px-8 py-3.5 rounded-sm text-sm font-semibold uppercase tracking-[0.1em] hover:bg-white transition-colors"
          >
            {cta.label}
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="text-sm lowercase tracking-wide text-white/90 underline underline-offset-4 hover:text-white transition-colors"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
