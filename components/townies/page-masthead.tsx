import { BrandPattern, type PatternVariant } from './brand-pattern';
import { cn } from '@/lib/utils';

/**
 * Dark masthead for the interior pages.
 *
 * Support, Request a Town, Wholesale and Ambassadors each opened with an
 * eyebrow, an H1 and a paragraph floating on flat cream — four pages with no
 * top edge and a lot of empty page above the fold. One component so the
 * treatment stays identical and the pattern is the only thing that varies.
 */
export function PageMasthead({
  eyebrow,
  title,
  sub,
  pattern = 'ma',
  align = 'left',
  children,
}: {
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  /** Vary this per page — four identical grounds read as one page. */
  pattern?: PatternVariant;
  align?: 'left' | 'center';
  children?: React.ReactNode;
}) {
  const centered = align === 'center';
  return (
    <section className="relative overflow-hidden bg-town-navy">
      {/* The MA silhouette is a big solid shape — at masthead scale it reads
          as blobs, so it runs quieter and larger than the fine-grained
          topo/pine/speckle tiles. */}
      <BrandPattern
        variant={pattern}
        color="cream"
        opacity={pattern === 'ma' ? 0.045 : 0.08}
        size={pattern === 'topo' ? 260 : pattern === 'ma' ? 230 : pattern === 'pine' ? 300 : 170}
      />
      <div
        className={cn(
          'relative max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20',
          centered && 'text-center',
        )}
      >
        <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/70 mb-3">
          {eyebrow}
        </p>
        <h1 className="font-block font-bold uppercase text-3xl sm:text-4xl lg:text-5xl leading-[0.95] tracking-[0.01em] text-white mb-4">
          {title}
        </h1>
        {sub ? (
          <p className={cn('text-town-cream/80 leading-relaxed max-w-xl', centered && 'mx-auto')}>
            {sub}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
