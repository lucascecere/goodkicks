// Admin brand filter — the single dimension the universal (two-brand) admin
// slices on. Townies + Good Kicks share one Shopify + one Supabase; this just
// scopes what the admin shows. Persisted in a cookie so it survives navigation
// and is readable by server components (getAdminBrand) without threading a
// query param through every link.

import { cookies } from 'next/headers';

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

// Server-side read of the active brand filter (App Router: cookies() is async).
export async function getAdminBrand(): Promise<AdminBrand> {
  const store = await cookies();
  return normalizeBrand(store.get(ADMIN_BRAND_COOKIE)?.value);
}

// Does an item of `itemBrand` pass the current `filter`?
export function brandMatches(filter: AdminBrand, itemBrand: RealBrand): boolean {
  return filter === 'all' || filter === itemBrand;
}
