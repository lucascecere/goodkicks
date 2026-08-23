import Link from 'next/link';
import { BrandImage } from '@/components/ui/brand-image';
import { cn } from '@/lib/utils';

/**
 * Alternating editorial split — big moody image + eyebrow, short declarative
 * headline, a heritage paragraph, and a lowercase text-link CTA. Generous
 * whitespace. Image degrades to a styled block via BrandImage.
 */
export function EditorialSplit({
  eyebrow,
  headline,
  body,
  cta,
  imageSrc,
  imageAlt,
  imageLabel,
  imageFit,
  reverse = false,
  tone = 'forest',
}: {
  eyebrow: string;
  headline: string;
  body: string;
  cta: { href: string; label: string };
  imageSrc?: string | null;
  imageAlt: string;
  imageLabel?: string;
  imageFit?: 'cover' | 'contain';
  reverse?: boolean;
  tone?: 'cream' | 'navy' | 'forest' | 'stone';
}) {
  return (
    <section className="bg-white border-y border-town-rule">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className={cn('relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden rounded-sm', reverse && 'lg:order-2')}>
          <BrandImage
            src={imageSrc}
            alt={imageAlt}
            label={imageLabel}
            tone={tone}
            fit={imageFit}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className={cn('max-w-md lg:max-w-xl', reverse && 'lg:order-1 lg:ml-auto')}>
          <p className="text-[0.625rem] uppercase tracking-[0.22em] font-medium text-town-forest mb-3">
            {eyebrow}
          </p>
          <h2 className="font-block font-bold uppercase text-2xl sm:text-3xl leading-none tracking-[0.015em] text-town-navy mb-4">
            {headline}
          </h2>
          <p className="text-town-muted leading-relaxed mb-6">{body}</p>
          <Link
            href={cta.href}
            className="text-sm lowercase tracking-wide text-town-navy underline underline-offset-4 hover:text-town-forest transition-colors"
          >
            {cta.label}
          </Link>
        </div>
        </div>
      </div>
    </section>
  );
}
