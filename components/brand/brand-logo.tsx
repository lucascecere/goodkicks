import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The Townies logos, as vector files from the brand kit
 * (~/lucashq/townies-brand-2026, Drive: CLIENTS/Townies/Assets/Brand). Every
 * word in them is outlined, so they render identically everywhere.
 *
 *   script         — primary: the Townies script, Navy → light grounds
 *   script-cream   — the script in Natural → dark grounds
 *   lockup         — script + state + APPAREL CO., full colour → light grounds
 *   lockup-cream   — the same, reversed → dark grounds
 *   sign           — secondary: the welcome plaque, filled face → light grounds, photos
 *   sign-navy      — the plaque with a Natural frame → Navy grounds
 *
 * Size with a height/width utility (e.g. `h-8 w-auto` or `w-64 h-auto`).
 */
const LOGOS = {
  script: { src: '/brand/logos/townies-script-navy.svg', w: 1048, h: 523, alt: 'Townies' },
  'script-cream': { src: '/brand/logos/townies-script-natural.svg', w: 1048, h: 523, alt: 'Townies' },
  lockup: { src: '/brand/logos/townies-script-lockup-full-color.svg', w: 1048, h: 524, alt: 'Townies Apparel Co.' },
  'lockup-cream': { src: '/brand/logos/townies-script-lockup-reversed.svg', w: 1048, h: 524, alt: 'Townies Apparel Co.' },
  sign: { src: '/brand/logos/townies-sign-full-color.svg', w: 1048, h: 965, alt: 'Welcome to Townies, Massachusetts' },
  'sign-navy': { src: '/brand/logos/townies-sign-full-color-on-navy.svg', w: 1048, h: 965, alt: 'Welcome to Townies, Massachusetts' },
} as const;

export type LogoVariant = keyof typeof LOGOS;

type LogoSrc = { src: string; w: number; h: number; alt: string };

/**
 * One logo image, raster or vector. SVGs go through a plain <img>: next/image
 * refuses first-party SVGs unless dangerouslyAllowSVG is on, and it is off.
 */
export function LogoImg({
  logo,
  className,
  alt,
  priority,
}: {
  logo: LogoSrc;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  if (logo.src.endsWith('.svg')) {
    // width/height attributes reserve the aspect ratio; a caller that sizes by
    // width only must not inherit the attribute height, so default to h-auto
    const sized = /(^|\s)([a-z]+:)?h-/.test(className ?? '');
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        width={logo.w}
        height={logo.h}
        alt={alt ?? logo.alt}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('max-w-full', !sized && 'h-auto', className)}
      />
    );
  }
  return (
    <Image
      src={logo.src}
      width={logo.w}
      height={logo.h}
      alt={alt ?? logo.alt}
      priority={priority}
      className={cn('max-w-full', className)}
    />
  );
}

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
  const img = <LogoImg logo={l} className={className} alt={alt} priority={priority} />;
  if (href == null) return img;
  return (
    <Link href={href} aria-label={alt ?? l.alt} className="inline-flex">
      {img}
    </Link>
  );
}
