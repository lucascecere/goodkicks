'use client';

import { useState } from 'react';

type Order = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  line_items: Array<{ variantId: string; quantity: number; name?: string }>;
  amount_total: number;
  shipping_address: Record<string, string> | null;
  status: string;
  tracking_number: string | null;
  promo_code: string | null;
};

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminOrdersTable({ orders: initial }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [shipping, setShipping] = useState<Record<string, 'loading' | 'done' | 'error'>>({});

  async function markShipped(orderId: string) {
    setShipping((s) => ({ ...s, [orderId]: 'loading' }));
    const res = await fetch('/api/admin/ship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, trackingNumber: tracking[orderId] ?? '' }),
    });
    if (res.ok) {
      setShipping((s) => ({ ...s, [orderId]: 'done' }));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'shipped', tracking_number: tracking[orderId] ?? '' }
            : o
        )
      );
    } else {
      setShipping((s) => ({ ...s, [orderId]: 'error' }));
    }
  }

  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl border border-brand-rule p-12 text-center text-brand-muted">
        no orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-brand-rule p-6 space-y-4">
          <div className="flex flex-wrap gap-4 justify-between items-start">
            <div>
              <p className="font-medium text-brand-ink">{order.customer_name || order.customer_email}</p>
              {order.customer_name && <p className="text-xs text-brand-muted">{order.customer_email}</p>}
              <p className="text-xs text-brand-muted mt-0.5">{order.created_at ? fmtDate(order.created_at) : '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              {order.promo_code && (
                <span className="bg-brand-rust/10 text-brand-rust text-xs font-medium px-2 py-1 rounded">
                  {order.promo_code}
                </span>
              )}
              <p className="font-medium text-brand-ink">{fmt(order.amount_total)}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                order.status === 'shipped'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-muted mb-1">items</p>
              {order.line_items?.map((item, i) => (
                <p key={i} className="text-brand-ink">{item.quantity}× {item.name ?? item.variantId}</p>
              ))}
            </div>
            {order.shipping_address && (
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted mb-1">ship to</p>
                <p className="text-brand-ink">
                  {[
                    order.shipping_address.line1,
                    order.shipping_address.line2,
                    `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}`,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>

          {order.status !== 'shipped' ? (
            <div className="flex gap-2 items-center pt-2 border-t border-brand-rule">
              <input
                type="text"
                placeholder="tracking number (optional)"
                value={tracking[order.id] ?? ''}
                onChange={(e) => setTracking((t) => ({ ...t, [order.id]: e.target.value }))}
                className="flex-1 border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/40"
              />
              <button
                onClick={() => markShipped(order.id)}
                disabled={shipping[order.id] === 'loading'}
                className="bg-brand-ink text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-ink/80 transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {shipping[order.id] === 'loading' ? 'marking…' : 'mark shipped →'}
              </button>
              {shipping[order.id] === 'error' && <span className="text-red-500 text-xs">failed</span>}
            </div>
          ) : (
            <p className="text-sm text-green-600 pt-2 border-t border-brand-rule">
              ✓ shipped{order.tracking_number ? ` · ${order.tracking_number}` : ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
