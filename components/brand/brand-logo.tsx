import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The real Townies logo lockups, extracted from the official brand kit
 * (public/brand/reference/townies-logo-variants-v1.png) as transparent PNGs.
 *
 *   script        — "Townies" script wordmark (navy) → light backgrounds
 *   script-cream  — full script lockup recolored cream → dark backgrounds
 *   arch          — "The Arch" full lockup (navy + forest) → light backgrounds
 *   sign          — "The Sign" town-welcome plaque → any background
 *
 * Size with a height/width utility (e.g. `h-8 w-auto` or `w-64 h-auto`).
 * These are interim raster extractions from the AI-rendered brand sheet; swap
 * for clean vector exports later — call sites stay the same.
 */

const LOGOS = {
  script: { src: '/brand/logos/script-word.png', w: 420, h: 159, alt: 'Townies' },
  'script-cream': { src: '/brand/logos/script-cream.png', w: 426, h: 214, alt: 'Townies Apparel Co.' },
  arch: { src: '/brand/logos/arch.png', w: 420, h: 253, alt: 'Townies Apparel Co.' },
  sign: { src: '/brand/logos/sign.png', w: 340, h: 339, alt: 'Welcome to Townies, Massachusetts' },
} as const;

export type LogoVariant = keyof typeof LOGOS;

export function BrandLogo({
  variant,
  className,
  href,
  alt,
  priority,
}: {
  variant: LogoVariant;
  className?: string;
  href?: string | null;
  alt?: string;
  priority?: boolean;
}) {
  const l = LOGOS[variant];
  const img = (
    <Image
      src={l.src}
      width={l.w}
      height={l.h}
      alt={alt ?? l.alt}
      priority={priority}
      className={cn('h-auto w-auto', className)}
    />
  );
  if (href == null) return img;
  return (
    <Link href={href} aria-label={alt ?? l.alt} className="inline-flex">
      {img}
    </Link>
  );
}
