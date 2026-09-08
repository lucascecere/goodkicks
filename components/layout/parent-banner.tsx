import { BrandLogo } from '@/components/brand/brand-logo';

// Slim parent-brand attribution strip shown ABOVE the Good Kicks header (on
// /goodkicks and on goodkicks.co). Good Kicks is a Townies brand: the logo
// links out to the Townies storefront; the Townies menu itself lives there, so
// this bar intentionally has no nav — just the mark + "A Townies Brand".
//
// Literal town-* colours on purpose: this strip IS Townies, whatever brand the
// page under it is wearing.
const TOWNIES_URL = process.env.NEXT_PUBLIC_TOWNIES_URL ?? 'https://townies.shop';

export function ParentBanner() {
  return (
    <aside aria-label="Parent brand" className="bg-town-navy text-town-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4">
        <BrandLogo
          variant="script-cream"
          href={TOWNIES_URL}
          alt="Townies — visit townies.shop"
          className="h-5 w-auto"
        />
        <span className="text-[11px] uppercase tracking-[0.18em] text-town-cream/70">
          A Townies Brand
        </span>
      </div>
    </aside>
  );
}
