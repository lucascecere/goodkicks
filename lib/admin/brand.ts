// Admin brand filter — the single dimension the universal (two-brand) admin
// slices on. Townies + Good Kicks share one Shopify + one Supabase; this just
// scopes what the admin shows. Persisted in a cookie so it survives navigation
// and is readable by server components without threading a query param through
// every link.
//
// Client-safe: pure types + constants only (no next/headers). The server-only
// cookie reader lives in ./brand-server so this module can be imported by the
// client BrandSwitcher without pulling server APIs into the browser bundle.

export type AdminBrand = 'all' | 'townies' | 'goodkicks';

export const ADMIN_BRAND_COOKIE = 'admin_brand';

export const BRAND_LABELS: Record<AdminBrand, string> = {
  all: 'All Brands',
  townies: 'Townies',
  goodkicks: 'Good Kicks',
};

// The two real brands (excludes the 'all' meta-option).
export type RealBrand = 'townies' | 'goodkicks';

export function normalizeBrand(value: string | undefined | null): AdminBrand {
  return value === 'townies' || value === 'goodkicks' ? value : 'all';
}

// Does an item of `itemBrand` pass the current `filter`?
export function brandMatches(filter: AdminBrand, itemBrand: RealBrand): boolean {
  return filter === 'all' || filter === itemBrand;
}
