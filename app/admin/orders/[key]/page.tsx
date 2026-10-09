import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { fmtDateTime, money } from '@/lib/admin/format';
import { getAdminOrder, PAYMENT_LABEL, SHIP_LABEL } from '@/lib/admin/orders';
import { Badge, Card, PageHeader, Row, btn } from '@/components/admin/ui';
import { MarketActions } from './market-actions';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const order = await getAdminOrder(key);
  if (!order) notFound();

  const itemCount = order.lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        back={{ href: '/admin/orders', label: 'Orders' }}
        eyebrow={fmtDateTime(order.createdAt, { year: true })}
        title={`Order ${order.number}`}
        right={
          <>
            <Badge tone={order.ship === 'fulfilled' ? 'good' : order.ship === 'cancelled' ? 'neutral' : 'warn'}>
              {order.shipLabel ?? SHIP_LABEL[order.ship]}
            </Badge>
            <Badge tone={order.payment === 'paid' ? 'good' : order.payment === 'refunded' ? 'bad' : 'warn'}>
              {PAYMENT_LABEL[order.payment]}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Card title={`Items · ${itemCount}`}>
            <ul className="divide-y divide-town-cream/[0.07]">
              {order.lines.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm text-town-cream">{l.title}</p>
                    {l.variant && <p className="text-xs text-town-cream/50">{l.variant}</p>}
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-town-cream/80">
                    {l.quantity} × {money(l.unitPrice)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-town-cream/10 px-4 py-3 sm:px-5">
              <Row label="Subtotal">{money(order.subtotal)}</Row>
              {order.discountCode && <Row label="Code">{order.discountCode}</Row>}
              <Row label="Shipping">{money(order.shipping)}</Row>
              <Row label="Tax">{money(order.tax)}</Row>
              <Row label="Total">
                <span className="font-semibold">{money(order.total)}</span>
              </Row>
            </div>
          </Card>

          {order.tracking.length > 0 && (
            <Card title="Tracking">
              <div className="px-4 py-2 sm:px-5">
                {order.tracking.map((t, i) => (
                  <Row key={i} label={t.company ?? 'Carrier'}>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="underline">
                        {t.number ?? 'Track'}
                      </a>
                    ) : (
                      t.number ?? '—'
                    )}
                    {t.status && <span className="ml-2 text-town-cream/50">{t.status.replace(/_/g, ' ')}</span>}
                  </Row>
                ))}
              </div>
            </Card>
          )}

          {order.note && (
            <Card title="Note">
              <p className="whitespace-pre-wrap px-4 py-3 text-sm text-town-cream/80 sm:px-5">{order.note}</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          {order.market && <MarketActions row={order} />}
          <Card title="Customer">
            <div className="px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-town-cream">{order.customer}</p>
              {order.email && (
                <a href={`mailto:${order.email}`} className="text-sm text-town-cream/60 underline">
                  {order.email}
                </a>
              )}
            </div>
          </Card>

          <Card title={order.market?.order.delivery === 'pickup' ? 'Pickup' : 'Ship to'}>
            <div className="px-4 py-3 text-sm leading-relaxed text-town-cream/80 sm:px-5">
              {order.address ? (
                <>
                  {order.address.name && <p className="text-town-cream">{order.address.name}</p>}
                  {order.address.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                  {order.address.phone && <p className="mt-1 text-town-cream/50">{order.address.phone}</p>}
                </>
              ) : (
                <p className="text-town-cream/50">No shipping address.</p>
              )}
            </div>
          </Card>

          {order.externalUrl && (
            <a href={order.externalUrl} target="_blank" rel="noopener noreferrer" className={`${btn.secondary} w-full`}>
              Ship or refund in Shopify <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
