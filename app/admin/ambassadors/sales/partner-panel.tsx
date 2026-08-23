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
    <div className="px-4 sm:px-6 mb-6">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-white/80 text-sm font-medium">Brand partners</h2>
        <p className="text-white/30 text-[11px]">Revenue is net of the partner discount</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ partner, stats }) => (
          <div
            key={partner.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4"
          >
            {partner.logo ? (
              <div className="shrink-0 w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
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
                <p className="text-white text-sm font-medium truncate">{partner.name}</p>
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                  {partner.code}
                </span>
                <span className="text-white/40 text-[11px]">{partner.discountPct}% off</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/35">Revenue</p>
                  <p className="text-white text-base font-semibold">
                    {money(stats.totalRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/35">Orders</p>
                  <p className="text-white text-base font-semibold">{stats.totalOrders}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    {partner.commissionPct > 0 ? `Owed (${partner.commissionPct}%)` : 'Owed'}
                  </p>
                  <p className="text-white text-base font-semibold">
                    {partner.commissionPct > 0 ? money(stats.commissionEarned) : '—'}
                  </p>
                </div>
              </div>

              <p className="mt-2.5 text-white/35 text-[11px]">
                Last order: {fmtDate(stats.lastOrderAt, 'No orders yet')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
