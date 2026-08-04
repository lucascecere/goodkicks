import { getAdminBrand } from '@/lib/admin/brand-server';
import { getAllRepStats } from '@/lib/shopify/get-rep-stats';
import { SalesClient } from './sales-client';

export const dynamic = 'force-dynamic';

export default async function RepSalesPage() {
  const brand = await getAdminBrand();
  const reps = await getAllRepStats(brand);

  // Serialise to the flat shape the client table needs — the client component
  // never needs the per-order detail, only the totals.
  const rows = reps.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    brand: r.brand,
    discountCode: r.discountCode,
    discountPct: r.discountPct,
    commissionPct: r.commissionPct,
    orders: r.stats.totalOrders,
    revenue: r.stats.totalRevenue,
    commission: r.stats.commissionEarned,
    lastOrderAt: r.stats.lastOrderAt,
  }));

  const truncated = reps.some((r) => r.stats.truncated);
  const shopifyConfigured = Boolean(
    process.env.SHOPIFY_ADMIN_API_TOKEN && process.env.SHOPIFY_STORE_DOMAIN,
  );

  return <SalesClient rows={rows} brand={brand} truncated={truncated} shopifyConfigured={shopifyConfigured} />;
}
