import Link from 'next/link';
import { cn } from '@/lib/utils';

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
        'font-block uppercase tracking-[0.15em] text-town-stone',
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
/** Accurate Massachusetts geometry — shared by MaMark and the logo lockups. */
export const MA_PATH =
  'M899.6,173.2L901.7,172.5L902.2,170.8L903.2,170.9L904.3,173.2L903,173.7L899.1,173.8L899.6,173.2zM890.2,174L892.5,171.4L894.1,171.4L895.9,172.9L893.5,173.9L891.3,174.9L890.2,174zM855.4,152L873,147.4L875.3,146.7L877.2,143.9L881,142.3L883.9,146.7L881.4,151.9L881.1,153.3L883,155.9L884.2,155.1L886,155.1L888.2,157.7L892.1,163.7L895.7,164.1L897.9,163.2L899.7,161.4L898.9,158.6L896.8,157L895.3,157.8L894.4,156.5L894.8,156.1L896.9,155.9L898.7,156.7L900.7,159.1L901.6,162L902,164.5L897.8,165.9L893.9,167.9L890,172.4L888.1,173.8L888.1,172.9L890.5,171.4L891,169.6L890.2,166.6L887.2,168L886.4,169.5L886.9,171.7L884.9,172.7L882.1,168.2L878.7,163.8L876.6,162L870.1,163.9L865,165L844.3,169.6L843.7,164.8L844.3,154.2L848.6,153.3L855.4,152z';
export const MA_VIEWBOX = '843.7 142.3 60.6 32.6';
/** bbox of MA_PATH: minX, minY, width, height. */
export const MA_BOX = { x: 843.7, y: 142.3, w: 60.6, h: 32.6 };

export function MaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="843.7 142.3 60.6 32.6"
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      <path d={MA_PATH} />
    </svg>
  );
}

export function PineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      <path d="M50 4 L70 46 L60 46 L82 84 L70 84 L92 122 L56 122 L56 138 L44 138 L44 122 L8 122 L30 84 L18 84 L40 46 L30 46 Z" />
    </svg>
  );
}
