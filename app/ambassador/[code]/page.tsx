import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getRepStats } from '@/lib/shopify/get-rep-stats';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { RealBrand } from '@/lib/admin/brand';
import { fmtDate } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rep Stats',
  robots: 'noindex',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

// Per-brand chrome. The page is unauthenticated (knowing the code is the only
// credential) and noindexed, so it renders standalone rather than inheriting
// site layout.
const THEME = {
  townies: {
    page: 'bg-town-cream',
    eyebrow: 'text-town-muted',
    heading: 'font-block uppercase text-town-navy',
    sub: 'text-town-muted',
    card: 'bg-town-navy',
    accent: '#2F4F3A',
    panel: 'bg-white border-town-rule',
    panelText: 'text-town-navy',
    divide: 'divide-town-rule',
    label: 'townie',
    contact: 'hello@townies.shop',
    rounded: 'rounded-sm',
  },
  goodkicks: {
    page: 'bg-[#FAF7F2]',
    eyebrow: 'text-brand-muted',
    heading: 'font-display text-brand-ink',
    sub: 'text-brand-muted',
    card: 'bg-brand-ink',
    accent: '#C66A3D',
    panel: 'bg-white border-brand-rule',
    panelText: 'text-brand-ink',
    divide: 'divide-brand-rule',
    label: 'good kicks ambassador',
    contact: 'info@goodkicks.co',
    rounded: 'rounded-2xl',
  },
} as const;

export default async function RepStatsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const supabase = createSupabaseServiceClient();
  const { data: app } = await supabase
    .from('ambassador_applications')
    .select('name, brand, town, discount_code, discount_pct, commission_pct, tier_pct, approved, age')
    .eq('discount_code', upperCode)
    .not('discount_code', 'is', null)
    .single();

  if (!app || !app.approved) notFound();

  const brand: RealBrand = app.brand === 'townies' ? 'townies' : 'goodkicks';
  const t = THEME[brand];
  const isTownies = brand === 'townies';
  const isMinor = typeof app.age === 'number' && app.age < 18;
  const commissionPct = app.commission_pct ?? app.tier_pct ?? 0;
  const discountPct = app.discount_pct ?? 15;

  const stats = await getRepStats({ code: upperCode, commissionPct, brand });
  const firstName = (app.name as string).split(' ')[0];
  const earnedLabel = isMinor ? 'Credit Earned' : 'Commission Earned';

  return (
    <div className={`min-h-screen ${t.page}`}>
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 space-y-10">

        {/* Header */}
        <div>
          <p className={`${t.eyebrow} text-sm mb-1`}>
            {isTownies ? `Townies town rep${app.town ? ` · ${app.town}` : ''}` : t.label}
          </p>
          <h1 className={`${t.heading} text-4xl sm:text-5xl`}>hey {firstName}.</h1>
          <p className={`${t.sub} mt-2`}>
            {isTownies ? "here's what your code has done." : "here's how your circle is growing."}
          </p>
        </div>

        {/* Code */}
        <div className={`${t.card} ${t.rounded} p-6 text-white space-y-4`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">your code</p>
              <p className="font-mono text-2xl font-bold tracking-widest">{upperCode}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">your rate</p>
              <p className="text-sm font-medium">
                {discountPct}% off · you earn {commissionPct}%
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Orders', value: String(stats.totalOrders) },
            { label: 'Revenue Driven', value: fmt(stats.totalRevenue) },
            { label: earnedLabel, value: fmt(stats.commissionEarned) },
          ].map((s) => (
            <div key={s.label} className={`${t.panel} border ${t.rounded} p-4 text-center`}>
              <p className={`text-xs ${t.sub} uppercase tracking-wide mb-1`}>{s.label}</p>
              <p className={`font-bold ${t.panelText} text-lg`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Earnings note */}
        <p className={`${t.sub} text-xs leading-relaxed`}>
          {isMinor
            ? `you earn ${commissionPct}% store credit on every order through your code — redeemable on anything we make, applied monthly.`
            : `you earn ${commissionPct}% of every order placed with your code — paid out monthly.`}
          {isTownies && ' only Townies orders count toward your total.'} any questions, reply to your
          welcome email.
        </p>

        {/* Recent orders */}
        {stats.orders.length > 0 && (
          <div className={`${t.panel} border ${t.rounded} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${isTownies ? 'border-town-rule' : 'border-brand-rule'}`}>
              <h2 className={`text-sm font-medium ${t.panelText} uppercase tracking-wide`}>Recent Orders</h2>
            </div>
            <div className={`divide-y ${t.divide}`}>
              {stats.orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className={`text-sm font-medium ${t.panelText}`}>{order.name}</p>
                    <p className={`text-xs ${t.sub}`}>{fmtDate(order.createdAt)}</p>
                  </div>
                  <p className={`text-sm ${t.panelText} font-medium`}>{fmt(order.revenue)}</p>
                </div>
              ))}
            </div>
            {stats.orders.length > 10 && (
              <p className={`px-5 py-3 text-xs ${t.sub} border-t ${isTownies ? 'border-town-rule' : 'border-brand-rule'}`}>
                showing your 10 most recent of {stats.orders.length} orders
              </p>
            )}
          </div>
        )}

        {stats.orders.length === 0 && (
          <div className={`${t.panel} border ${t.rounded} p-10 text-center space-y-2`}>
            <p className={`${t.heading} text-xl`}>no orders yet.</p>
            <p className={`${t.sub} text-sm`}>
              {isTownies ? 'get your code out there and rep your town.' : 'share your code and make the circle bigger.'}
            </p>
          </div>
        )}

        <p className={`text-center ${t.sub} text-xs`}>
          stats update every 5 minutes ·{' '}
          <a href={`mailto:${t.contact}`} className="hover:underline">questions?</a>
        </p>
      </div>
    </div>
  );
}
