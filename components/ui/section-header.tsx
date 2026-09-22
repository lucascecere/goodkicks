import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The one place the section type ramp is written down.
 *
 * Every section header on the site used to re-type its own eyebrow and H2,
 * which is how the page ended up with headlines at 60px, 72px and 96px that
 * were all meant to be the same level. Emitting them from here means shrinking
 * the ramp is one edit, not a search across a dozen files.
 *
 * Takes explicit props with NO className passthrough on purpose: `cn` in
 * lib/utils is a naive join rather than tailwind-merge, so a passed `text-4xl`
 * would emit alongside the ramp class and leave stylesheet order to pick the
 * winner. Same reasoning as the `fit` prop on BrandImage.
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  link,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  /** One line under the H2 — what the section is for, when the title alone is thin. */
  sub?: string;
  link?: { href: string; label: string };
  /**
   * 'center' is the 2026-09 default for a full-width section: a centred, larger
   * heading is what separates one band from the next now that the page no
   * longer leans on a colour change for every boundary. Rails that carry
   * scroll arrows on the same line stay 'left', so the title and the controls
   * can share the row.
   */
  align?: 'left' | 'center';
}) {
  const centred = align === 'center';
  return (
    <div
      className={cn(
        'gap-4 mb-6 sm:mb-8',
        centred ? 'flex flex-col items-center text-center' : 'flex items-end justify-between',
      )}
    >
      <div className={cn(centred && 'max-w-2xl')}>
        {eyebrow && (
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-accent mb-2">
            {eyebrow}
          </p>
        )}
        {/* Up from 24/30px. The ramp had every section whispering at the same
            volume as body copy; a browse page needs its sections to announce
            themselves before the eye reaches the products. */}
        <h2
          className={cn(
            'heading leading-[0.95] text-text',
            centred ? 'text-3xl sm:text-4xl lg:text-[2.75rem]' : 'text-2xl sm:text-3xl lg:text-[2rem]',
          )}
        >
          {title}
        </h2>
        {sub && (
          <p className={cn('text-sm text-muted mt-3', centred && 'mx-auto max-w-xl')}>{sub}</p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className={cn(
            'shrink-0 text-[0.6875rem] uppercase tracking-[0.18em] underline underline-offset-[6px] decoration-1 text-text hover:text-accent transition-colors',
            centred ? 'mt-5 inline-block' : 'hidden sm:inline-block',
          )}
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
