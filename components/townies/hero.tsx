import Link from 'next/link';
import { MaMark } from '@/components/brand/wordmark';
import { BrandImage } from '@/components/ui/brand-image';

/**
 * The homepage hero: one photograph, one title, one button.
 *
 * WHAT CHANGED AND WHY. This used to be a `min-h-[calc(100svh-6.75rem)]`
 * full-viewport band carrying a 128px headline, a script line, an eyebrow with
 * an icon, a sub-paragraph and two CTAs, over a cross-fading slideshow behind
 * two gradient scrims. It rendered ~4000px tall — nearly half the page — and
 * the photograph underneath it was reduced to texture.
 *
 * Now the picture is the hero and the words introduce it. The container is a
 * fixed aspect ratio rather than viewport height, so the image is never scaled
 * up to fill a tall screen, and there is ONE scrim, across the bottom two
 * fifths, because that is the only part the caption sits on.
 *
 * The headline is BLOCK, not script. The brand sheet assigns display type to
 * College Block and reserves the script for brand-level signatures — the
 * wordmark and the tagline band. It is spent once per page, and not here.
 */
export function Hero({
  eyebrow = 'Massachusetts · one town at a time',
  headline = 'Rep your town.',
  sub = 'Hats for people who’d defend their exit off the expressway. Stitched heavy, one town at a time.',
  cta = { href: '/shop', label: 'Shop all towns' },
  imageSrc,
  mobileSrc,
  imageAlt = '',
}: {
  eyebrow?: string;
  headline?: string;
  sub?: string;
  cta?: { href: string; label: string };
  imageSrc?: string | null;
  /** Recomposed crop for narrow screens — a 16:10 frame does not survive a phone. */
  mobileSrc?: string | null;
  imageAlt?: string;
}) {
  return (
    <section className="relative w-full aspect-square sm:aspect-[16/10] overflow-hidden bg-town-navy">
      <BrandImage
        src={imageSrc}
        mobileSrc={mobileSrc}
        alt={imageAlt}
        tone="navy"
        priority
        sizes="100vw"
      />

      {/* Two scrims, both anchored to the bottom-left corner where the caption
          actually sits — NOT the old pair, which washed the whole frame to make
          white text safe anywhere and turned the photograph into texture.
          A bottom band handles the horizon, and a corner-weighted radial keeps
          the copy legible over the bright clover without touching the caps. */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-town-navy/85 via-town-navy/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_0%_100%,rgba(13,27,42,0.8)_0%,rgba(13,27,42,0.35)_38%,transparent_66%)]" />

      <div className="absolute bottom-0 left-0 max-w-md p-6 sm:p-10 lg:p-14 text-white">
        <p className="flex items-center gap-2.5 text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-cream/80 mb-3">
          <MaMark className="h-2 w-auto shrink-0 opacity-70" />
          {eyebrow}
        </p>
        <h1 className="font-block font-bold uppercase text-[1.75rem] sm:text-[2rem] lg:text-[2.5rem] leading-[0.98] tracking-[0.005em]">
          {headline}
        </h1>
        <p className="text-[0.8125rem] leading-relaxed text-town-cream/80 mt-2.5 mb-6">{sub}</p>
        <Link
          href={cta.href}
          className="inline-flex items-center rounded-none bg-town-cream px-6 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-town-navy transition-colors hover:bg-white"
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
