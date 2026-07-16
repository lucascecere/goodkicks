import Link from 'next/link';
import { BrandImage } from '@/components/ui/brand-image';
import { TowniesBlock } from '@/components/brand/wordmark';
import type { TownView } from '@/lib/townies/towns';
import { cn } from '@/lib/utils';

/**
 * Tall portrait story card (~0.69 aspect). The TOWN NAME is the giant hero;
 * the Townies block sits small like a woven tag. Lifestyle-first via BrandImage,
 * degrades to a styled block when there's no photo. Placeholder towns link to
 * /shop (no handle yet); real towns link to their PDP.
 */
export function TownCard({
  town,
  priority,
  className,
}: {
  town: TownView;
  priority?: boolean;
  className?: string;
}) {
  const href =
    town.href ?? (town.isPlaceholder || !town.handle ? '/shop' : `/products/${town.handle}`);

  return (
    <Link
      href={href}
      className={cn(
        '@container group relative block overflow-hidden rounded-sm bg-town-cream aspect-[11/16]',
        className,
      )}
    >
      <BrandImage
        src={town.image}
        alt={town.imageAlt}
        tone="navy"
        priority={priority}
        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
        className="transition-transform duration-700 group-hover:scale-[1.04]"
      />

      {/* legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-town-navy/80 via-town-navy/10 to-town-navy/5" />

      {/* content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 text-white">
        <TowniesBlock className="text-[0.6rem] text-white/70 mb-1" />
        {/* Town-as-hero: fluid size keyed to card width so long names never clip. */}
        <h3 className="font-block uppercase leading-[0.9] tracking-[0.01em] text-[clamp(1.05rem,12.5cqi,2.25rem)]">
          {town.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[0.7rem] uppercase tracking-[0.18em] text-white/70">
            {town.regionLabel}
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-white/90 underline-offset-4 group-hover:underline">
            {town.isPlaceholder ? 'coming soon' : town.price ? `shop · ${town.price}` : 'shop'}
          </span>
        </div>
      </div>
    </Link>
  );
}
