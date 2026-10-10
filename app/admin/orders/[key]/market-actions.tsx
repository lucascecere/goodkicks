import { Printer } from 'lucide-react';
import { ActionButton, ActionForm } from '@/components/admin/action';
import { Badge, Card, Row, btn, field } from '@/components/admin/ui';
import { dollars } from '@/lib/shop/money';
import { listPayouts } from '@/lib/shop/db';
import { labelGuard, shippoConfigured } from '@/lib/shop/shippo';
import { fmtDate } from '@/lib/admin/format';
import type { AdminOrderRow } from '@/lib/admin/orders';
import {
  buyLabelAction,
  markShippedAction,
  refundOrderAction,
  setFulfillmentAction,
} from '@/app/admin/market/actions';
import { PAYOUT_TONE } from '@/app/admin/market/tones';

// What you can do with one of our own (market) orders, in the order you'd do
// it: make it if we're out, then label + ship it, or drop it off for pickup.
export async function MarketActions({ row }: { row: AdminOrderRow }) {
  const { order: o, items, sellers } = row.market!;
  const payouts = await listPayouts({ orderId: o.id });
  const paid = o.status === 'paid';
  const ourCut = items.reduce((n, i) => n + i.our_cut_cents, 0);
  const pickupAt = o.pickup_seller_id ? sellers[o.pickup_seller_id] : null;

  return (
    <>
      <Card title="Next step">
        <div className="space-y-4 px-4 py-4 sm:px-5">
          {!paid && <p className="text-sm text-town-cream/60">This order is {o.status.replace('_', ' ')}. Nothing to do.</p>}

          {paid && o.fulfillment === 'needs_production' && (
            <div className="space-y-2">
              <p className="text-sm text-amber-200">We were out of buffer when this sold. Reorder from RoyalBacks, then:</p>
              <ActionButton action={setFulfillmentAction.bind(null, o.id, 'unfulfilled')}>Hats are here</ActionButton>
            </div>
          )}

          {paid && o.delivery === 'ship' && (o.fulfillment === 'unfulfilled' || o.fulfillment === 'needs_production') && (
            <div className="space-y-3">
              {o.label_url ? (
                <a href={o.label_url} target="_blank" rel="noopener noreferrer" className={`${btn.primary} w-full`}>
                  <Printer className="h-4 w-4" /> Print label
                </a>
              ) : shippoConfigured() && labelGuard() ? (
                <p className="text-xs text-amber-200">{labelGuard()}</p>
              ) : shippoConfigured() ? (
                <ActionButton look="primary" className="w-full" action={buyLabelAction.bind(null, o.id)}>
                  <Printer className="h-4 w-4" /> Buy USPS label
                </ActionButton>
              ) : (
                <p className="text-xs text-town-cream/50">Labels turn on once SHIPPO_API_KEY is set. You can still ship by hand and add tracking below.</p>
              )}
              <ActionForm action={markShippedAction.bind(null, o.id)} className="space-y-2">
                {!o.tracking_number && <input name="tracking" placeholder="Tracking number (if you shipped by hand)" className={field} />}
                <button type="submit" className={`${btn.secondary} w-full`}>
                  Mark shipped and email tracking
                </button>
              </ActionForm>
            </div>
          )}

          {paid && o.delivery === 'pickup' && (o.fulfillment === 'unfulfilled' || o.fulfillment === 'needs_production') && (
            <ActionButton look="primary" className="w-full" action={setFulfillmentAction.bind(null, o.id, 'ready_for_pickup')}>
              Dropped at {pickupAt?.name ?? 'the shop'}: tell the buyer
            </ActionButton>
          )}

          {paid && o.fulfillment === 'ready_for_pickup' && (
            <ActionButton look="primary" className="w-full" action={setFulfillmentAction.bind(null, o.id, 'picked_up')}>
              Buyer picked it up
            </ActionButton>
          )}

          {paid && ['shipped', 'delivered', 'picked_up'].includes(o.fulfillment) && (
            <p className="text-sm text-emerald-300">Done. {o.handed_over_at ? `Handed over ${fmtDate(o.handed_over_at)}.` : ''}</p>
          )}

          {(o.status === 'paid' || o.status === 'partially_refunded') && (
            <div className="border-t border-town-cream/10 pt-3">
              <ActionButton look="danger" className="w-full" action={refundOrderAction.bind(null, o.id)} confirm={`Refund the full ${dollars(o.total_cents)} to ${o.buyer_name ?? 'the buyer'}?`}>
                Refund order
              </ActionButton>
            </div>
          )}
        </div>
      </Card>

      <Card title="Money">
        <div className="px-4 py-3 sm:px-5">
          <Row label="We keep (before Stripe fee)">{dollars(ourCut + o.shipping_cents)}</Row>
          {o.label_cost_cents != null && <Row label="Label cost">−{dollars(o.label_cost_cents)}</Row>}
          {payouts.map((p) => (
            <Row key={p.id} label={p.recipient === 'royalbacks' ? 'RoyalBacks' : (sellers[p.seller_id ?? '']?.name ?? 'Business')}>
              <span className="inline-flex items-center gap-2">
                {dollars(p.amount_cents)} <Badge tone={PAYOUT_TONE[p.status]}>{p.status}</Badge>
              </span>
            </Row>
          ))}
          <Row label="Tax collected">{dollars(o.tax_cents)}</Row>
        </div>
      </Card>
    </>
  );
}
