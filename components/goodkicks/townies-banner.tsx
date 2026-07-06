import { BrandLogo } from '@/components/brand/brand-logo';

// Slim parent-brand attribution strip shown ABOVE the Good Kicks header (only on
// the /goodkicks scope = goodkicks.co). Good Kicks is a Townies brand: the logo
// links out to the Townies storefront; the Townies menu itself lives there, so
// this bar intentionally has no nav — just the mark + "A Townies Brand".
const TOWNIES_URL = process.env.NEXT_PUBLIC_TOWNIES_URL ?? 'https://townies.shop';

export function TowniesBanner() {
  return (
    <div className="bg-town-navy text-town-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">
        {/* Left: Townies mark → townies.shop (the Townies storefront) */}
        <BrandLogo
          variant="script-cream"
          href={TOWNIES_URL}
          alt="Townies — visit townies.shop"
          className="h-4 sm:h-5 w-auto"
        />
        {/* Right: attribution text (no menu) */}
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-town-cream/70">
          A Townies Brand
        </span>
      </div>
    </div>
  );
}
