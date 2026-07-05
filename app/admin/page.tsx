import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getOrderSummary } from '@/lib/shopify/get-orders';
import { getBundleTally } from '@/lib/shopify/get-bundle-tally';
import { getAdminBrand, BRAND_LABELS, type AdminBrand, type RealBrand } from '@/lib/admin/brand';
import { BrandBadge } from '@/components/admin/brand-badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

type ContactSub = {
  id: string;
  name: string;
  email: string;
  type: string | null;
  message: string | null;
  brand: RealBrand;
  created_at: string;
};

// Resilient read of contact_submissions: works whether or not the `brand`
// column has been migrated in yet, and back-fills legacy null rows → goodkicks
// (they predate Townies). Filters in-memory to the active brand.
type RawContactRow = {
  id: string;
  name: string;
  email: string;
  type: string | null;
  message: string | null;
  brand?: string | null;
  created_at: string;
};

async function fetchContactSubmissions(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  brand: AdminBrand,
): Promise<ContactSub[]> {
  const withBrand = await supabase
    .from('contact_submissions')
    .select('id, name, email, type, message, brand, created_at')
    .order('created_at', { ascending: false });

  let rows: RawContactRow[];
  if (withBrand.error && /brand|column/i.test(withBrand.error.message)) {
    const noBrand = await supabase
      .from('contact_submissions')
      .select('id, name, email, type, message, created_at')
      .order('created_at', { ascending: false });
    rows = (noBrand.data ?? []) as unknown as RawContactRow[];
  } else {
    rows = (withBrand.data ?? []) as unknown as RawContactRow[];
  }

  const normalized: ContactSub[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    type: r.type,
    message: r.message,
    created_at: r.created_at,
    brand: r.brand === 'townies' ? 'townies' : 'goodkicks',
  }));

  return brand === 'all' ? normalized : normalized.filter((r) => r.brand === brand);
}

function StatCard({ label, value, sub, href }: { label: string; value: number; sub: string; href?: string }) {
  const inner = (
    <div className="bg-white/8 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-4xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/40 text-xs leading-relaxed">{sub}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboardPage() {
  const brand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();

  // Ambassadors are Good Kicks-only for now (schema unchanged this pass), so the
  // Townies view shows none. Bundles are a Good Kicks product — skip the Shopify
  // bundle fetch entirely when scoped to Townies.
  const showAmbassadors = brand !== 'townies';
  const showBundles = brand !== 'townies';

  const [{ data: apps }, contactSubs, orderSummary, bundleTallies] = await Promise.all([
    brand === 'townies'
      ? Promise.resolve({ data: [] as Array<{ id: string; name: string; email: string; instagram: string; status: string; approved: boolean; created_at: string }> })
      : supabase
          .from('ambassador_applications')
          .select('id, name, email, instagram, status, approved, created_at')
          .order('created_at', { ascending: false }),
    fetchContactSubmissions(supabase, brand),
    getOrderSummary(brand),
    showBundles ? getBundleTally() : Promise.resolve([]),
  ]);

  const allApps = apps ?? [];
  const allContacts = contactSubs;

  const pending = allApps.filter((a) => !a.approved && a.status !== 'rejected').length;
  const approved = allApps.filter((a) => a.approved).length;

  const recentApps = allApps.slice(0, 5);
  const recentContacts = allContacts.slice(0, 5);

  const brandLabel = brand === 'all' ? 'All brands' : BRAND_LABELS[brand];

  const externalLinks = [
    {
      label: 'Shopify',
      desc: 'orders · products · discounts',
      href: 'https://admin.shopify.com/store/good-kicks-foot-bags-2',
    },
    {
      label: 'Google Analytics',
      desc: 'traffic · sessions · conversions',
      href: 'https://analytics.google.com',
    },
    {
      label: 'Resend',
      desc: 'email delivery logs',
      href: 'https://resend.com',
    },
  ];

  return (
    <div className="p-8 max-w-5xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">{brandLabel.toLowerCase()} overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Applications"
          value={allApps.length}
          sub={showAmbassadors ? `${pending} pending` : 'Good Kicks only'}
          href="/admin/ambassadors"
        />
        <StatCard
          label="Approved"
          value={approved}
          sub={showAmbassadors ? 'active ambassadors' : '—'}
          href="/admin/ambassadors"
        />
        <StatCard
          label="Pending Review"
          value={pending}
          sub={pending > 0 ? 'needs action' : 'all clear'}
          href="/admin/ambassadors"
        />
        <StatCard
          label="Contacts"
          value={allContacts.length}
          sub={brand === 'all' ? 'form submissions' : `${brandLabel} submissions`}
          href="/admin/contacts"
        />
      </div>

      {/* Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Orders {brand !== 'all' && <span className="text-white/40 normal-case font-normal">· {brandLabel}</span>}
          </h2>
          <a href="https://admin.shopify.com/store/good-kicks-foot-bags-2/orders" target="_blank" rel="noopener noreferrer" className="text-xs text-white/40 hover:text-white transition-colors">manage in shopify →</a>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/8 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Total Orders</p>
            <p className="text-4xl font-bold text-white">{orderSummary.totalOrders}</p>
          </div>
          <div className="bg-white/8 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">{brand === 'all' ? 'Total Revenue' : 'Brand Revenue'}</p>
            <p className="text-4xl font-bold text-white">{fmtMoney(orderSummary.totalRevenue)}</p>
          </div>
          <div className="bg-white/8 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Avg Order Value</p>
            <p className="text-4xl font-bold text-white">{fmtMoney(orderSummary.avgOrderValue)}</p>
          </div>
        </div>
        {brand !== 'all' && (
          <p className="text-white/30 text-xs">
            Per-brand revenue sums that brand&apos;s line items (excludes shipping &amp; order-level discounts).
          </p>
        )}
      </div>

      {/* Bundle Inventory Tracker — Good Kicks product */}
      {showBundles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Bundle Inventory <span className="text-white/40 normal-case font-normal">· Good Kicks</span></h2>
            <a
              href="https://admin.shopify.com/store/good-kicks-foot-bags-2/products"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              update shopify inventory →
            </a>
          </div>

          {bundleTallies.length === 0 ? (
            <div className="bg-white/8 border border-white/10 rounded-xl p-6 text-center">
              <p className="text-white/40 text-sm">no bundle orders yet — colorway picks will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bundleTallies.map((bundle) => {
                const max = bundle.colorways[0]?.units ?? 1;
                return (
                  <div key={bundle.bundleTitle} className="bg-white rounded-xl border border-brand-rule overflow-hidden">
                    <div className="px-5 py-4 border-b border-brand-rule flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-brand-ink">{bundle.bundleTitle} — Colorway Picks</h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                          {bundle.totalOrders} order{bundle.totalOrders !== 1 ? 's' : ''} · {bundle.totalUnits} total units to fulfill
                        </p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full">
                        deduct from shopify
                      </span>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {bundle.colorways.map((cw) => {
                        const pct = Math.round((cw.units / max) * 100);
                        return (
                          <div key={cw.name} className="flex items-center gap-4">
                            <span className="text-sm text-brand-ink capitalize w-28 shrink-0 font-medium">{cw.name}</span>
                            <div className="flex-1 h-2 bg-brand-rule rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-rust rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-brand-ink w-6 text-right shrink-0">{cw.units}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contacts + Ambassadors panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent contacts */}
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-rule flex items-center justify-between">
            <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Contacts</h2>
            <Link href="/admin/contacts" className="text-xs text-brand-rust hover:underline">view all →</Link>
          </div>
          {recentContacts.length === 0 ? (
            <p className="px-5 py-8 text-brand-muted text-sm text-center">no submissions yet.</p>
          ) : (
            <div className="divide-y divide-brand-rule">
              {recentContacts.map((c) => (
                <Link
                  key={c.id}
                  href="/admin/contacts"
                  className="flex items-start justify-between px-5 py-3.5 hover:bg-[#FAF7F2] transition-colors group gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{c.name}</p>
                    <p className="text-xs text-brand-muted truncate max-w-xs">
                      {c.message ? c.message.slice(0, 55) + (c.message.length > 55 ? '…' : '') : c.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {brand === 'all' && <BrandBadge brand={c.brand} />}
                    <span className="text-xs text-brand-muted">{fmtDate(c.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent ambassadors */}
        <div className="bg-white rounded-xl border border-brand-rule overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-rule flex items-center justify-between">
            <h2 className="text-sm font-medium text-brand-ink uppercase tracking-wide">Ambassadors</h2>
            <Link href="/admin/ambassadors" className="text-xs text-brand-rust hover:underline">view all →</Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="px-5 py-8 text-brand-muted text-sm text-center">
              {brand === 'townies' ? 'ambassadors are Good Kicks-only for now.' : 'no applications yet.'}
            </p>
          ) : (
            <div className="divide-y divide-brand-rule">
              {recentApps.map((a) => {
                const badge = a.approved
                  ? { label: 'approved', cls: 'bg-green-100 text-green-700' }
                  : a.status === 'rejected'
                  ? { label: 'rejected', cls: 'bg-red-100 text-red-600' }
                  : { label: 'pending', cls: 'bg-amber-100 text-amber-700' };
                return (
                  <Link
                    key={a.id}
                    href={`/admin/ambassadors/${a.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAF7F2] transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-ink group-hover:text-brand-rust transition-colors">{a.name}</p>
                      <p className="text-xs text-brand-muted">{a.instagram}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                      <span className="text-xs text-brand-muted">{fmtDate(a.created_at)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* External links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {externalLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 transition-colors group"
          >
            <div>
              <p className="text-white text-sm font-medium">{l.label}</p>
              <p className="text-white/40 text-xs mt-0.5">{l.desc}</p>
            </div>
            <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm">→</span>
          </a>
        ))}
      </div>
    </div>
  );
}
