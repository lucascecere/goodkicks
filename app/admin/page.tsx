import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { getBundleTally } from '@/lib/shopify/get-bundle-tally';
import { BRAND_LABELS, type AdminBrand, type RealBrand } from '@/lib/admin/brand';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { BrandBadge } from '@/components/admin/brand-badge';
import Link from 'next/link';
import { fmtDateShort, money } from '@/lib/admin/format';
import { listAdminOrders, needsShipping } from '@/lib/admin/orders';
import { Badge, Card, PageHeader, Stat } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

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

export default async function AdminDashboardPage() {
  const brand = await getAdminBrand();
  const supabase = createSupabaseServiceClient();

  // Both brands run a rep program now, so ambassadors are filtered by brand
  // rather than hidden. Bundles remain a Good Kicks product — skip the Shopify
  // bundle fetch entirely when scoped to Townies.
  const showBundles = brand !== 'townies';

  const ambassadorQuery = supabase
    .from('ambassador_applications')
    .select('id, name, email, instagram, status, approved, created_at')
    .order('created_at', { ascending: false });

  const [{ data: apps }, contactSubs, { orders }, bundleTallies] = await Promise.all([
    brand === 'all' ? ambassadorQuery : ambassadorQuery.eq('brand', brand),
    fetchContactSubmissions(supabase, brand),
    listAdminOrders(brand),
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

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent30 = orders.filter((o) => Date.parse(o.createdAt) >= since && o.payment !== 'voided');
  const revenue30 = recent30.reduce((sum, o) => sum + o.total, 0);
  const toShip = orders.filter(needsShipping);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader eyebrow={brandLabel} title="Home" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="To ship" value={toShip.length} sub={toShip.length ? 'paid, not shipped yet' : 'all caught up'} href="/admin/orders" />
        <Stat label="Orders · 30 days" value={recent30.length} href="/admin/orders?view=all" />
        <Stat label="Sales · 30 days" value={money(revenue30, { decimals: 0 })} sub="incl. shipping + tax" />
        <Stat label="Reps to review" value={pending} sub={`${approved} active`} href="/admin/ambassadors" />
      </div>

      <Card title="To ship" action={<Link href="/admin/orders" className="text-xs text-town-cream/50 hover:text-town-cream">All orders →</Link>}>
        {toShip.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-town-cream/45">Nothing waiting. Every paid order has gone out.</p>
        ) : (
          <ul className="divide-y divide-town-cream/[0.07]">
            {toShip.slice(0, 6).map((o) => (
              <li key={o.key}>
                <Link href={`/admin/orders/${o.key}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-town-cream">
                      {o.number} <span className="font-normal text-town-cream/50">· {o.customer}</span>
                    </p>
                    <p className="truncate text-xs text-town-cream/50">
                      {o.lines.map((l) => `${l.title}${l.quantity > 1 ? ` ×${l.quantity}` : ''}`).join(', ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-town-cream/40">{fmtDateShort(o.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showBundles && bundleTallies.length > 0 && (
        <Card title="Good Kicks bundle picks">
          <div className="space-y-5 px-4 py-4 sm:px-5">
            {bundleTallies.map((bundle) => {
              const max = bundle.colorways[0]?.units ?? 1;
              return (
                <div key={bundle.bundleTitle}>
                  <p className="text-sm text-town-cream">{bundle.bundleTitle}</p>
                  <p className="mb-3 text-xs text-town-cream/45">
                    {bundle.totalOrders} order{bundle.totalOrders !== 1 ? 's' : ''} · {bundle.totalUnits} units to fulfill
                  </p>
                  <div className="space-y-2">
                    {bundle.colorways.map((cw) => (
                      <div key={cw.name} className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-sm capitalize text-town-cream/80">{cw.name}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-town-cream/10">
                          <div className="h-full rounded-full bg-town-cream" style={{ width: `${Math.round((cw.units / max) * 100)}%` }} />
                        </div>
                        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-town-cream">{cw.units}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Messages" action={<Link href="/admin/contacts" className="text-xs text-town-cream/50 hover:text-town-cream">View all →</Link>}>
          {recentContacts.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-town-cream/45">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-town-cream/[0.07]">
              {recentContacts.map((c) => (
                <li key={c.id}>
                  <Link href="/admin/contacts" className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm text-town-cream">{c.name}</p>
                      <p className="truncate text-xs text-town-cream/50">{c.message ? c.message.slice(0, 70) : c.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {brand === 'all' && <BrandBadge brand={c.brand} />}
                      <span className="text-xs text-town-cream/40">{fmtDateShort(c.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Reps" action={<Link href="/admin/ambassadors" className="text-xs text-town-cream/50 hover:text-town-cream">View all →</Link>}>
          {recentApps.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-town-cream/45">No applications yet.</p>
          ) : (
            <ul className="divide-y divide-town-cream/[0.07]">
              {recentApps.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/ambassadors/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm text-town-cream">{a.name}</p>
                      <p className="truncate text-xs text-town-cream/50">{a.instagram}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.approved ? <Badge tone="good">Approved</Badge> : a.status === 'rejected' ? <Badge tone="bad">Rejected</Badge> : <Badge tone="warn">Pending</Badge>}
                      <span className="text-xs text-town-cream/40">{fmtDateShort(a.created_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {externalLinks.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-town-cream/10 px-4 py-3 transition-colors hover:border-town-cream/30"
          >
            <p className="text-sm text-town-cream">{l.label}</p>
            <p className="mt-0.5 text-xs text-town-cream/40">{l.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
