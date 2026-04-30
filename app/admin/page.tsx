'use client';

import { useEffect, useState } from 'react';

type Order = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name: string | null;
  stripe_session_id: string;
  line_items: Array<{ variantId: string; quantity: number; name?: string }>;
  amount_total: number;
  shipping_address: Record<string, unknown> | null;
  status: string;
  tracking_number: string | null;
  shipped_at: string | null;
};

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingInputs, setShippingInputs] = useState<Record<string, string>>({});
  const [shippingStatus, setShippingStatus] = useState<Record<string, string>>({});

  async function fetchOrders(pwd: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-password': pwd },
      });
      if (res.status === 401) { setError('Wrong password'); setLoading(false); return; }
      const data = await res.json();
      setOrders(data.orders ?? []);
      setAuthed(true);
    } catch {
      setError('Failed to load orders');
    }
    setLoading(false);
  }

  async function markShipped(orderId: string, tracking: string) {
    setShippingStatus((s) => ({ ...s, [orderId]: 'loading' }));
    const res = await fetch('/api/admin/ship', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ orderId, trackingNumber: tracking }),
    });
    if (res.ok) {
      setShippingStatus((s) => ({ ...s, [orderId]: 'shipped' }));
      fetchOrders(password);
    } else {
      setShippingStatus((s) => ({ ...s, [orderId]: 'error' }));
    }
  }

  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-3xl text-brand-ink">admin</h1>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders(password)}
            className="w-full border border-brand-rule rounded px-4 py-2.5 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/50"
          />
          <button
            onClick={() => fetchOrders(password)}
            disabled={loading}
            className="w-full bg-brand-rust text-white py-2.5 rounded font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'loading…' : 'sign in'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-brand-ink">orders</h1>
        <button onClick={() => fetchOrders(password)} className="text-sm text-brand-muted hover:text-brand-ink transition-colors">refresh</button>
      </div>

      {orders.length === 0 && <p className="text-brand-muted">no orders yet.</p>}

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="border border-brand-rule rounded-lg p-6 space-y-4">
            <div className="flex flex-wrap gap-4 justify-between items-start">
              <div>
                <p className="font-medium text-brand-ink">{order.customer_email}</p>
                {order.customer_name && <p className="text-sm text-brand-muted">{order.customer_name}</p>}
                <p className="text-xs text-brand-muted mt-1">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-brand-ink">{formatCents(order.amount_total)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'shipped' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {order.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-brand-muted mb-1">items</p>
              <ul className="text-sm text-brand-ink space-y-0.5">
                {order.line_items.map((item, i) => (
                  <li key={i}>{item.quantity}× {item.name ?? item.variantId}</li>
                ))}
              </ul>
            </div>

            {order.shipping_address && (
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-muted mb-1">ship to</p>
                <p className="text-sm text-brand-ink whitespace-pre-wrap">
                  {[
                    (order.shipping_address as Record<string, string>).line1,
                    (order.shipping_address as Record<string, string>).line2,
                    `${(order.shipping_address as Record<string, string>).city}, ${(order.shipping_address as Record<string, string>).state} ${(order.shipping_address as Record<string, string>).postal_code}`,
                  ].filter(Boolean).join('\n')}
                </p>
              </div>
            )}

            {order.status !== 'shipped' ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="tracking number"
                  value={shippingInputs[order.id] ?? ''}
                  onChange={(e) => setShippingInputs((s) => ({ ...s, [order.id]: e.target.value }))}
                  className="flex-1 border border-brand-rule rounded px-3 py-2 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-rust/50"
                />
                <button
                  onClick={() => markShipped(order.id, shippingInputs[order.id] ?? '')}
                  disabled={shippingStatus[order.id] === 'loading'}
                  className="bg-brand-ink text-white px-4 py-2 rounded text-sm hover:bg-brand-ink/80 transition-colors disabled:opacity-60"
                >
                  {shippingStatus[order.id] === 'loading' ? 'marking…' : 'mark shipped'}
                </button>
                {shippingStatus[order.id] === 'error' && <span className="text-red-500 text-xs">failed</span>}
              </div>
            ) : (
              <p className="text-sm text-green-600">shipped · tracking: {order.tracking_number ?? 'n/a'}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
