import Link from 'next/link';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { fmtDate, money } from '@/lib/admin/format';
import {
  listAdminOrders,
  needsShipping,
  PAYMENT_LABEL,
  SHIP_LABEL,
  type AdminOrderRow,
  type PaymentState,
  type ShipState,
} from '@/lib/admin/orders';
import { Badge, EmptyState, PageHeader, field, type BadgeTone } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const VIEWS = [
  { id: 'to-ship', label: 'To ship' },
  { id: 'market', label: 'Market' },
  { id: 'all', label: 'All' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'refunded', label: 'Refunded' },
] as const;
type View = (typeof VIEWS)[number]['id'];

const PAY_TONE: Record<PaymentState, BadgeTone> = {
  paid: 'good',
  pending: 'warn',
  refunded: 'bad',
  partially_refunded: 'warn',
  voided: 'neutral',
  disputed: 'bad',
  other: 'neutral',
};
const SHIP_TONE: Record<ShipState, BadgeTone> = {
  unfulfilled: 'warn',
  partial: 'info',
  fulfilled: 'good',
  cancelled: 'neutral',
  archived: 'neutral',
};

function inView(o: AdminOrderRow, view: View): boolean {
  switch (view) {
    case 'to-ship':
      return needsShipping(o);
    // Every order from our own checkout, whatever its state, so a shipped one
    // can still be found to refund (they drop out of To ship once shipped).
    case 'market':
      return o.source === 'market';
    case 'shipped':
      return o.ship === 'fulfilled';
    case 'refunded':
      return o.payment === 'refunded' || o.payment === 'partially_refunded';
    default:
      return true;
  }
}

function matches(o: AdminOrderRow, q: string): boolean {
  if (!q) return true;
  const hay = [o.number, o.customer, o.email, o.discountCode, ...o.lines.map((l) => l.title)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q.toLowerCase());
}

function itemsSummary(o: AdminOrderRow): string {
  const count = o.lines.reduce((n, l) => n + l.quantity, 0);
  const first = o.lines[0]?.title ?? '';
  return o.lines.length > 1 ? `${first} + ${o.lines.length - 1} more` : count > 1 ? `${first} ×${count}` : first;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const view: View = (VIEWS.find((v) => v.id === sp.view)?.id ?? 'to-ship') as View;
  const q = (sp.q ?? '').trim();

  const brand = await getAdminBrand();
  const { orders, truncated, configured } = await listAdminOrders(brand);

  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, orders.filter((o) => inView(o, v.id)).length]));
  const shown = orders.filter((o) => inView(o, view) && matches(o, q));

  const href = (v: View) => {
    const p = new URLSearchParams();
    if (v !== 'to-ship') p.set('view', v);
    if (q) p.set('q', q);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Orders"
        title="Orders"
        description="Every order in one list. Market orders ship and refund right here; Shopify orders still ship in Shopify for now."
      />

      {/* View tabs + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={href(v.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                view === v.id ? 'bg-town-cream text-town-navy' : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
              }`}
            >
              {v.label}
              <span className={view === v.id ? 'text-town-navy/60' : 'text-town-cream/35'}>{counts[v.id]}</span>
            </Link>
          ))}
        </div>
        <form action="/admin/orders" className="sm:w-72">
          {view !== 'to-ship' && <input type="hidden" name="view" value={view} />}
          <input name="q" defaultValue={q} placeholder="Search name, email, #, hat…" className={field} />
        </form>
      </div>

      {!configured ? (
        <EmptyState title="Shopify isn't connected" body="SHOPIFY_ADMIN_API_TOKEN and SHOPIFY_STORE_DOMAIN aren't set in this environment." />
      ) : shown.length === 0 ? (
        <EmptyState
          title={view === 'to-ship' && !q ? 'Nothing to ship' : 'No orders here'}
          body={view === 'to-ship' && !q ? 'Every paid order has gone out.' : 'Try another tab or search.'}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-town-cream/10 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-town-cream/10 bg-town-cream/[0.03] text-left">
                  {['Order', 'Date', 'Customer', 'Items', 'Payment', 'Shipping', 'Total'].map((h, i) => (
                    <th key={h} className={`admin-eyebrow px-4 py-3 font-bold ${i === 6 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.key} className="border-b border-town-cream/[0.07] last:border-0 hover:bg-town-cream/[0.04]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.key}`} className="font-semibold text-town-cream hover:underline">
                        {o.number}
                      </Link>
                      {o.source === 'market' && <span className="ml-2"><Badge tone="info">Market</Badge></span>}
                    </td>
                    <td className="px-4 py-3 text-town-cream/60">{fmtDate(o.createdAt)}</td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-town-cream">{o.customer}</td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-town-cream/70">{itemsSummary(o)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PAY_TONE[o.payment]}>{PAYMENT_LABEL[o.payment]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={SHIP_TONE[o.ship]}>{o.shipLabel ?? SHIP_LABEL[o.ship]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-town-cream">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone cards */}
          <div className="space-y-2 md:hidden">
            {shown.map((o) => (
              <Link
                key={o.key}
                href={`/admin/orders/${o.key}`}
                className="block rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 active:bg-town-cream/[0.08]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-town-cream">
                      {o.number} <span className="font-normal text-town-cream/50">· {o.customer}</span>
                      {o.source === 'market' && <span className="ml-2 align-middle"><Badge tone="info">Market</Badge></span>}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-town-cream/55">{itemsSummary(o)}</p>
                  </div>
                  <p className="shrink-0 tabular-nums text-town-cream">{money(o.total)}</p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge tone={SHIP_TONE[o.ship]}>{o.shipLabel ?? SHIP_LABEL[o.ship]}</Badge>
                  <Badge tone={PAY_TONE[o.payment]}>{PAYMENT_LABEL[o.payment]}</Badge>
                  <span className="ml-auto text-xs text-town-cream/40">{fmtDate(o.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>

          {truncated && (
            <p className="mt-4 text-xs text-town-cream/40">Showing the most recent 5,000 orders.</p>
          )}
        </>
      )}
    </div>
  );
}
