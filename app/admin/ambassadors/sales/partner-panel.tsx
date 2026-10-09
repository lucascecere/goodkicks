import Image from 'next/image';
import { partnersForBrand } from '@/lib/partners/partners';
import { getRepStats } from '@/lib/shopify/get-rep-stats';
import type { AdminBrand } from '@/lib/admin/brand';
import { money, fmtDate } from '@/lib/admin/format';

// Brand partners, above the rep leaderboard.
//
// Same revenue engine as the reps (getRepStats, so the net-of-discount maths is
// shared and can't drift), but partners are a config list rather than database
// rows — see lib/partners/partners.ts for why.

export async function PartnerPanel({ brand }: { brand: AdminBrand }) {
  const partners = partnersForBrand(brand);
  if (partners.length === 0) return null;

  const rows = await Promise.all(
    partners.map(async (p) => ({
      partner: p,
      stats: await getRepStats({
        code: p.code,
        commissionPct: p.commissionPct,
        brand: p.brand,
      }),
    })),
  );

  return (
    <div className="mb-6">
      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="admin-eyebrow">Brand partners</h2>
        <p className="text-[11px] text-town-cream/40">Revenue is net of the partner discount</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ partner, stats }) => (
          <div
            key={partner.id}
            className="flex gap-4 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4"
          >
            {partner.logo ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-town-cream/10">
                <Image
                  src={partner.logo}
                  alt=""
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="truncate text-sm font-semibold text-town-cream">{partner.name}</p>
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                  {partner.code}
                </span>
                <span className="text-[11px] text-town-cream/45">{partner.discountPct}% off</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="admin-eyebrow">Revenue</p>
                  <p className="font-block text-lg font-bold text-town-cream tabular-nums">
                    {money(stats.totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="admin-eyebrow">Orders</p>
                  <p className="font-block text-lg font-bold text-town-cream tabular-nums">{stats.totalOrders}</p>
                </div>
                <div>
                  <p className="admin-eyebrow">
                    {partner.commissionPct > 0 ? `Owed (${partner.commissionPct}%)` : 'Owed'}
                  </p>
                  <p className="font-block text-lg font-bold text-town-cream tabular-nums">
                    {partner.commissionPct > 0 ? money(stats.commissionEarned) : '—'}
                  </p>
                </div>
              </div>

              <p className="mt-2.5 text-[11px] text-town-cream/40">
                Last order: {fmtDate(stats.lastOrderAt, 'No orders yet')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
