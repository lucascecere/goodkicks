import Link from 'next/link';
import { BrandImage } from '@/components/ui/brand-image';
import { cn } from '@/lib/utils';

/**
 * A full-bleed campaign band: one photograph, a small caption in one corner,
 * one underlined text link.
 *
 * These stack. Two or three in a row is the spine of the homepage — each one a
 * town, a drop or a season. The caption is deliberately tiny; the picture is
 * carrying the section and a big headline on top of it just fights the photo.
 *
 * `align` alternates between instances. Two bands with the caption in the same
 * corner read as one repeated component rather than two campaigns, and the
 * scrim follows the caption so the copy always has ground under it.
 *
 * Note the CTA is a text link, not a filled button — the filled button is spent
 * once per page, in the hero.
 */
export function CampaignBand({
  src,
  mobileSrc,
  alt,
  eyebrow,
  title,
  sub,
  cta,
  align = 'left',
  valign = 'center',
  priority,
}: {
  src?: string | null;
  mobileSrc?: string | null;
  alt: string;
  eyebrow?: string;
  title: string;
  sub?: string;
  cta: { href: string; label: string };
  align?: 'left' | 'right';
  /**
   * Where the caption sits vertically. `center` suits a frame with a clear side
   * — the Milton curb has empty asphalt down its left. Use `bottom` when the
   * product fills the frame edge to edge and the only clean ground is the floor,
   * which is the case on the Braintree sidewalk: a side-anchored caption there
   * lands squarely on a navy cap, white-on-navy, unreadable.
   */
  valign?: 'center' | 'bottom';
  priority?: boolean;
}) {
  const right = align === 'right';
  const bottom = valign === 'bottom';

  return (
    <section className="relative w-full aspect-[4/5] sm:aspect-[21/9] overflow-hidden bg-ink">
      <BrandImage
        src={src}
        mobileSrc={mobileSrc}
        alt={alt}
        tone="navy"
        priority={priority}
        sizes="100vw"
      />

      {/* Scrim follows the caption, so the copy always has ground under it and
          the rest of the photograph stays untouched. */}
      <div
        className={cn(
          'absolute inset-0',
          bottom
            ? 'bg-gradient-to-t from-ink/90 via-ink/35 to-transparent'
            : right
              ? 'bg-gradient-to-l from-ink/85 via-ink/25 to-transparent'
              : 'bg-gradient-to-r from-ink/85 via-ink/25 to-transparent',
        )}
      />

      <div
        className={cn(
          'absolute inset-y-0 flex flex-col max-w-md p-6 sm:p-10 lg:p-14 text-white',
          bottom ? 'justify-end' : 'justify-end sm:justify-center',
          right ? 'right-0 sm:items-end sm:text-right' : 'left-0',
        )}
      >
        {eyebrow && (
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-ink-contrast/75 mb-2.5">
            {eyebrow}
          </p>
        )}
        <h2 className="display text-[2.25rem] sm:text-[2.75rem] lg:text-[3.5rem]">{title}</h2>
        {sub && <p className="text-base leading-relaxed text-ink-contrast/85 mt-3 max-w-sm">{sub}</p>}
        <Link
          href={cta.href}
          className="mt-6 inline-flex w-fit items-center rounded-none bg-ink-contrast px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-white"
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
