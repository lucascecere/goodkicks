import type { RealBrand } from '@/lib/admin/brand';

// Small brand tag for admin rows. 'mixed' = an order spanning both brands.
type BadgeBrand = RealBrand | 'mixed';

const STYLES: Record<BadgeBrand, { label: string; cls: string }> = {
  townies: { label: 'Townies', cls: 'bg-[#0D1B2A] text-white' },
  goodkicks: { label: 'Good Kicks', cls: 'bg-[#C66A3D] text-white' },
  mixed: { label: 'Both', cls: 'bg-[#6B6B6B] text-white' },
};

export function BrandBadge({ brand }: { brand: BadgeBrand }) {
  const s = STYLES[brand];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
