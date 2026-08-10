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

/**
 * One tier of the conifer: a triangle whose underside is sawtoothed into
 * drooping branch tips.
 *
 * The brand sheet's pine is a LAYERED tree — four overlapping tiers with
 * scalloped edges and a short trunk — not the stacked chevrons this used to
 * draw. Generating each tier means the silhouette can be retuned by changing
 * four numbers instead of rewriting a 15-point path by hand.
 */
function conifferTier(apexY: number, halfWidth: number, baseY: number, notch = 10): string {
  const cx = 50;
  const h = halfWidth;
  return [
    `M ${cx} ${apexY}`,
    `L ${cx + h} ${baseY}`,
    `L ${cx + (h * 2) / 3} ${baseY - notch}`,
    `L ${cx + h / 3} ${baseY}`,
    `L ${cx} ${baseY - notch}`,
    `L ${cx - h / 3} ${baseY}`,
    `L ${cx - (h * 2) / 3} ${baseY - notch}`,
    `L ${cx - h} ${baseY}`,
    'Z',
  ].join(' ');
}

const PINE_TIERS: Array<[number, number, number]> = [
  [6, 17, 42],
  [26, 25, 68],
  [50, 33, 95],
  [74, 41, 122],
];

export function PineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      {/* Trunk first so the lowest tier overlaps it, as on the sheet. */}
      <path d="M44 112 L56 112 L56 134 L44 134 Z" />
      {PINE_TIERS.map(([apexY, hw, baseY]) => (
        <path key={apexY} d={conifferTier(apexY, hw, baseY)} />
      ))}
    </svg>
  );
}

/**
 * Directional signpost — the "one town at a time" mark. Two pairs of arrow
 * boards on a single post, each board rivetted near the point.
 */
export function SignpostMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      <path d="M45 6 L55 6 L55 134 L45 134 Z" />
      {/* Boards. The rivet is knocked OUT with evenodd rather than painted in
          the page colour, so the mark survives on cream, navy or forest. */}
      <path
        fillRule="evenodd"
        d="M55 30 L88 30 L96 41 L88 52 L55 52 Z M88.2 41 A3.2 3.2 0 0 0 81.8 41 A3.2 3.2 0 0 0 88.2 41 Z"
      />
      <path
        fillRule="evenodd"
        d="M45 30 L12 30 L4 41 L12 52 L45 52 Z M18.2 41 A3.2 3.2 0 0 0 11.8 41 A3.2 3.2 0 0 0 18.2 41 Z"
      />
      <path
        fillRule="evenodd"
        d="M55 66 L88 66 L96 77 L88 88 L55 88 Z M88.2 77 A3.2 3.2 0 0 0 81.8 77 A3.2 3.2 0 0 0 88.2 77 Z"
      />
      <path
        fillRule="evenodd"
        d="M45 66 L12 66 L4 77 L12 88 L45 88 Z M18.2 77 A3.2 3.2 0 0 0 11.8 77 A3.2 3.2 0 0 0 18.2 77 Z"
      />
    </svg>
  );
}

/**
 * Anchor — the coastal mark for South Shore / shipping moments.
 *
 * Solid, like every other icon on the brand sheet. Drawn as a stroke first,
 * which left it visibly spindly beside the filled pine and signpost.
 */
/** Left arm of the anchor; the right is the same path mirrored about x=50. */
const ANCHOR_ARM = 'M 50 131 C 27 131 10 111 10 78 L 1 62 L 24 68 C 24 98 35 117 50 117 Z';

export function AnchorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 140"
      aria-hidden
      className={cn('inline-block', className)}
      fill="currentColor"
    >
      {/* Ring — the bore is knocked out with evenodd so it works on any ground. */}
      <path
        fillRule="evenodd"
        d="M62 18 A12 12 0 1 0 38 18 A12 12 0 1 0 62 18 Z M55.5 18 A5.5 5.5 0 1 1 44.5 18 A5.5 5.5 0 1 1 55.5 18 Z"
      />
      {/* Shank */}
      <path d="M44 24 L56 24 L56 128 L44 128 Z" />
      {/* Stock */}
      <path d="M18 43 L82 43 L78 53 L22 53 Z" />
      {/* Arms + flukes */}
      <path d={ANCHOR_ARM} />
      <path d={ANCHOR_ARM} transform="matrix(-1 0 0 1 100 0)" />
    </svg>
  );
}
