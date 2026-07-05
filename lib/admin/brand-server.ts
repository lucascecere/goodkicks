import 'server-only';
import { cookies } from 'next/headers';
import { type AdminBrand, ADMIN_BRAND_COOKIE, normalizeBrand } from './brand';

// Server-side read of the active admin brand filter (App Router: cookies() is
// async). Kept out of ./brand so that client components can import the shared
// types/constants without dragging next/headers into the browser bundle.
export async function getAdminBrand(): Promise<AdminBrand> {
  const store = await cookies();
  return normalizeBrand(store.get(ADMIN_BRAND_COOKIE)?.value);
}
