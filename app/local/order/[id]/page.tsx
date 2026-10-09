import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder, getOrderItems, getSeller } from '@/lib/shop/db';
import { dollars } from '@/lib/shop/money';
import { MARKET_BASE } from '@/lib/shop/paths';
import { ClearBagOnThanks } from '@/components/market/clear-bag';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your order', robots: { index: false } };

const STEPS: Record<string, string> = {
  unfulfilled: 'Getting it ready',
  needs_production: 'Being stitched',
  ready_for_pickup: 'Ready for pickup',
  picked_up: 'Picked up',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Canceled',
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ thanks?: string }>;
}) {
  const { id } = await params;
  const { thanks } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getOrder(id);
  if (!order || order.status === 'canceled') notFound();
  const [items, pickup] = await Promise.all([
    getOrderItems(order.id),
    order.pickup_seller_id ? getSeller(order.pickup_seller_id) : Promise.resolve(null),
  ]);
  const pending = order.status === 'pending';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
      {thanks && <ClearBagOnThanks />}
      <p className="font-label text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-muted">Order L{order.number}</p>
      <h1 className="display mt-2 text-[2.25rem] text-text sm:text-[2.75rem]">
        {pending ? 'Confirming your payment…' : thanks ? 'Thank you.' : STEPS[order.fulfillment]}
      </h1>
      <p className="mt-3 text-muted">
        {pending
          ? 'This takes a few seconds. Refresh the page if it does not update.'
          : order.delivery === 'pickup'
            ? `Pickup at ${pickup?.name ?? 'the shop'}${pickup?.pickup_address ? `, ${pickup.pickup_address}` : ''}. We email you when it's there.`
            : order.tracking_url
              ? 'It is on the way.'
              : 'We email tracking as soon as it ships.'}
      </p>
      {order.tracking_url && (
        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block bg-accent px-6 py-3.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-accent-contrast">
          Track package
        </a>
      )}

      <ul className="mt-10 divide-y divide-rule border-y border-rule">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-text">
              {i.title}
              {i.qty > 1 && <span className="text-muted"> ×{i.qty}</span>}
            </span>
            <span className="tabular-nums text-text">{dollars(i.unit_price_cents * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 text-sm text-muted">
        <div className="flex justify-between"><span>{order.delivery === 'pickup' ? 'Pickup' : 'Shipping'}</span><span>{order.shipping_cents ? dollars(order.shipping_cents) : 'Free'}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{dollars(order.tax_cents)}</span></div>
        <div className="flex justify-between pt-1 text-base font-semibold text-text"><span>Total</span><span>{dollars(order.total_cents)}</span></div>
      </div>

      <Link href={MARKET_BASE} className="mt-10 inline-block text-sm text-text underline underline-offset-4">
        Back to the market
      </Link>
    </div>
  );
}
