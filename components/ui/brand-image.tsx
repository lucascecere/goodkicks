import Image from 'next/image';
import { cn } from '@/lib/utils';
import { MaMark } from '@/components/brand/wordmark';
import { BrandPattern, type PatternColor } from '@/components/townies/brand-pattern';

/**
 * Centralized image slot. Every lifestyle / product image on Townies goes
 * through here so the build NEVER depends on photography we don't have yet:
 * when `src` is missing it degrades to a styled brand-colored block. Swap real
 * photos in later by passing `src` — no layout change.
 *
 * Fill-based: wrap in a `relative` element that sets the aspect ratio.
 */

type Tone = 'cream' | 'navy' | 'forest' | 'stone';

const TONE: Record<Tone, string> = {
  cream: 'bg-town-cream text-town-stone',
  navy: 'bg-town-navy text-town-cream/40',
  forest: 'bg-town-forest text-town-cream/40',
  stone: 'bg-town-stone text-town-cream/60',
};

// MA pattern color + opacity that reads well on each tone.
const PLACEHOLDER_PATTERN: Record<Tone, { color: PatternColor; opacity: number }> = {
  cream: { color: 'forest', opacity: 0.1 },
  navy: { color: 'cream', opacity: 0.07 },
  forest: { color: 'cream', opacity: 0.08 },
  stone: { color: 'cream', opacity: 0.12 },
};

export function BrandImage({
  src,
  alt,
  sizes,
  priority,
  className,
  tone = 'cream',
  label,
}: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  tone?: Tone;
  /** Optional caption shown on the placeholder only (e.g. the town name). */
  label?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '100vw'}
        priority={priority}
        className={cn('object-cover', className)}
      />
    );
  }

  const pat = PLACEHOLDER_PATTERN[tone];
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-3 select-none overflow-hidden',
        TONE[tone],
      )}
    >
      <BrandPattern variant="ma" color={pat.color} opacity={pat.opacity} size={130} fade="radial" />
      <MaMark className="relative h-9 w-auto opacity-50" />
      {label && (
        <span className="relative font-block uppercase tracking-[0.12em] text-sm opacity-70">
          {label}
        </span>
      )}
    </div>
  );
}
