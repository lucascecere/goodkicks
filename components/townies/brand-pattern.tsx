import { cn } from '@/lib/utils';

/**
 * Townies brand pattern layer. Renders one of the four brand patterns
 * (MA shapes · pine · topo contours · speckle) as a tiling background at low
 * opacity — section backgrounds, packaging-style bands, placeholder fills.
 *
 * BRAND RULE: use sparingly and quietly. Never behind running body text.
 * The MA pattern is the signature — lead with it; the others are supporting.
 *
 * Usage: drop inside a `relative overflow-hidden` parent.
 *   <div className="relative overflow-hidden ...">
 *     <BrandPattern variant="ma" color="cream" opacity={0.07} />
 *     <div className="relative">…content…</div>
 *   </div>
 *
 * Colors are baked into the SVG files (see /public/brand/patterns) so they
 * render identically everywhere — opacity is controlled here.
 */

export type PatternVariant = 'ma' | 'pine' | 'topo' | 'speckle';
export type PatternColor = 'forest' | 'navy' | 'cream' | 'white';
type Fade = 'none' | 'b' | 't' | 'y' | 'l' | 'r' | 'radial';

const DEFAULT_SIZE: Record<PatternVariant, number> = {
  ma: 150,
  pine: 130,
  topo: 200,
  speckle: 130,
};

const FADE: Record<Fade, string | undefined> = {
  none: undefined,
  b: 'linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)',
  t: 'linear-gradient(to top, #000 0%, #000 45%, transparent 100%)',
  y: 'linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)',
  l: 'linear-gradient(to left, #000 0%, #000 45%, transparent 100%)',
  r: 'linear-gradient(to right, #000 0%, #000 45%, transparent 100%)',
  radial: 'radial-gradient(120% 120% at 50% 50%, #000 35%, transparent 78%)',
};

export function BrandPattern({
  variant = 'ma',
  color = 'forest',
  size,
  opacity = 0.1,
  fade = 'none',
  className,
}: {
  variant?: PatternVariant;
  color?: PatternColor;
  /** Tile size in px. Defaults are tuned per pattern. */
  size?: number;
  opacity?: number;
  /** Soft-fade the pattern so it doesn't read as a hard rectangle. */
  fade?: Fade;
  className?: string;
}) {
  const mask = FADE[fade];
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `url(/brand/patterns/${variant}-${color}.svg)`,
        backgroundRepeat: 'repeat',
        backgroundSize: `${size ?? DEFAULT_SIZE[variant]}px`,
        opacity,
        ...(mask
          ? { WebkitMaskImage: mask, maskImage: mask }
          : {}),
      }}
    />
  );
}
