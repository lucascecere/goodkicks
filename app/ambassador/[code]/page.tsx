import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getAmbassadorStats } from '@/lib/shopify/get-ambassador-stats';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ambassador Stats — Good Kicks',
  robots: 'noindex',
};

const TIERS = [
  { label: 'Starter', min: 0,  max: 10,  next: 'Repping',  pct: 8  },
  { label: 'Repping', min: 11, max: 30,  next: 'Anchor',   pct: 12 },
  { label: 'Anchor',  min: 31, max: null, next: null,       pct: 20 },
];

function getTierInfo(orders: number) {
  return TIERS.find((t) => t.max === null || orders <= t.max) ?? TIERS[2];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function AmbassadorStatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const supabase = createSupabaseServiceClient();
  const { data: app } = await supabase
    .from('ambassador_applications')
    .select('name, instagram, tier_pct, approved')
    .eq('discount_code', upperCode)
    .eq('approved', true)
    .single();

  if (!app) notFound();

  const tierPct = (app.tier_pct as number | null) ?? 8;
  const stats = await getAmbassadorStats(upperCode, tierPct);
  const tier = getTierInfo(stats.totalOrders);
  const firstName = (app.name as string).split(' ')[0];

  const progressPct = tier.max
    ? Math.min(100, Math.round((stats.totalOrders / tier.max) * 100))
    : 100;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 space-y-10">

        {/* Header */}
        <div>
          <p className="text-brand-muted text-sm mb-1">good kicks ambassador</p>
          <h1 className="font-display text-4xl sm:text-5xl text-brand-ink">hey {firstName}.</h1>
          <p className="text-brand-muted mt-2">here&apos;s how your circle is growing.</p>
        </div>

        {/* Code + tier */}
        <div className="bg-brand-ink rounded-2xl p-6 text-white space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">your code</p>
              <p className="font-mono text-2xl font-bold tracking-widest">{upperCode}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">tier</p>
              <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{tier.label}</span>
            </div>
          </div>

          {tier.next && (
            <div>
              <div className="flex justify-between text-xs text-white/40 mb-1.5">
                <span>{stats.totalOrders} orders</span>
                <span>{tier.max} to reach {tier.next}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C66A3D] rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Orders', value: String(stats.totalOrders) },
            { label: 'Revenue Driven', value: fmt(stats.totalRevenue) },
            { label: 'Commission', value: fmt(stats.commissionEarned) },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-brand-rule rounded-xl p-4 text-center">
              <p className="text-xs text-brand-muted uppercase tracking-wide mb-1">{s.label}</p>
              <p className="font-bold text-brand-ink text-lg">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Commission note */}
        <p className="text-brand-muted text-xs">
          commission is calculated at {tierPct}% of order value. reach {tier.next ?? 'the top'} tier
          {tier.next ? ` (${tier.max! + 1}+ orders) to earn ${TIERS.find(t => t.label === tier.next)?.pct}%` : ' — you\'re at the top'}.
          we settle commissions monthly — any questions, reply to your welcome email.
        </p>

        {/* Recent orders */}
        {stats.orders.length > 0 && (
          <div className="bg-white border border-brand-rule rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-rule">
              <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Recent Orders</h2>
            </div>
            <div className="divide-y divide-brand-rule">
              {stats.orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-brand-ink">{order.name}</p>
                    <p className="text-xs text-brand-muted">{fmtDate(order.createdAt)}</p>
                  </div>
                  <p className="text-sm text-brand-ink font-medium">{fmt(order.amount)}</p>
                </div>
              ))}
            </div>
            {stats.hasMore && (
              <p className="px-5 py-3 text-xs text-brand-muted border-t border-brand-rule">
                showing first 250 orders
              </p>
            )}
          </div>
        )}

        {stats.orders.length === 0 && (
          <div className="bg-white border border-brand-rule rounded-xl p-10 text-center space-y-2">
            <p className="font-display text-xl text-brand-ink">no orders yet.</p>
            <p className="text-brand-muted text-sm">share your code and make the circle bigger.</p>
          </div>
        )}

        <p className="text-center text-brand-muted text-xs">
          stats update every 5 minutes · <a href="mailto:goodkicksfootbags@gmail.com" className="hover:text-brand-ink transition-colors">questions?</a>
        </p>
      </div>
    </div>
  );
}
