import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MA_TRACED_PATH, MA_TRACED_VIEWBOX } from '@/components/brand/town-icons';

/**
 * Townies brand marks.
 *
 * BRAND PRINCIPLE: the TOWN NAME is the hero; "Townies" is the small trusted
 * label. Use <TowniesScript> for brand-level moments (header, hero signature,
 * footer), <TowniesBlock> for the small woven-tag style label, and <TownName>
 * for the giant collegiate town headline on cards + product pages.
 *
 * These render as live HTML text using the loaded Townies font tokens, so they
 * never depend on an image asset existing — the "styled text wordmark" fallback
 * the brief asks for IS the default. SVGs in /public/brand are available for
 * later when real marks are designed.
 */

export function TowniesScript({
  className,
  href = '/',
}: {
  className?: string;
  href?: string | null;
}) {
  const mark = (
    <span
      className={cn('font-script leading-none text-town-navy', className)}
      // sensible default size; callers override via className text-* utilities
      style={{ fontSize: className?.includes('text-') ? undefined : '2rem' }}
    >
      Townies
    </span>
  );
  if (href === null) return mark;
  return (
    <Link href={href} aria-label="Townies — home" className="inline-flex items-center">
      {mark}
    </Link>
  );
}

export function TowniesBlock({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-block uppercase tracking-[0.15em] text-town-muted',
        className,
      )}
    >
      Townies
    </span>
  );
}

/**
 * The hero of every card + PDP. Town name is dominant; the small Townies block
 * label sits above it like a woven tag.
 */
export function TownName({
  name,
  label = true,
  className,
  labelClassName,
  as: As = 'span',
}: {
  name: string;
  label?: boolean;
  className?: string;
  labelClassName?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span';
}) {
  return (
    <span className="block">
      {label && (
        <TowniesBlock className={cn('block text-[0.65rem] mb-1', labelClassName)} />
      )}
      <As
        className={cn(
          'font-block uppercase leading-[0.9] tracking-[0.01em] text-town-navy',
          className,
        )}
      >
        {name}
      </As>
    </span>
  );
}

/**
 * Small unifying MA accent — never the product hero, just a quiet mark.
 * Accurate Massachusetts silhouette (mainland + Cape Cod hook + the islands).
 */
/** Massachusetts geometry, shared by MaMark and anything else that draws the state.
 *  This is the state as drawn on the brand's Sign (traced from the kit), so the small
 *  mark and the logo are the same shape. The old map-derived path was too coarse. */
export const MA_PATH = MA_TRACED_PATH;
export const MA_VIEWBOX = MA_TRACED_VIEWBOX;
/** bbox of MA_PATH: minX, minY, width, height. */
export const MA_BOX = { x: 0, y: 0, w: 1000, h: 597.03 };

export function MaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={MA_VIEWBOX}
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      <path fillRule="evenodd" d={MA_PATH} />
    </svg>
  );
}
