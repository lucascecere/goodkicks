import { createSupabaseServiceClient } from '@/lib/supabase/client';
import { AdminOrdersTable } from './orders-table';

function fmt(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function AdminOrdersPage() {
  const supabase = createSupabaseServiceClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const all = orders ?? [];
  const totalRevenue = all.reduce((sum, o) => sum + (o.amount_total ?? 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">Orders</h1>
        <p className="text-white/50 text-sm mt-1">all orders from goodkicks.co</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: all.length.toString() },
          { label: 'Total Revenue', value: fmt(totalRevenue) },
          { label: 'Avg Order', value: all.length ? fmt(Math.round(totalRevenue / all.length)) : '—' },
          { label: 'With Promo Code', value: all.filter((o) => o.promo_code).length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/10 rounded-xl p-5 border border-white/10">
            <p className="text-xs text-white/50 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className="font-display text-2xl text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdminOrdersTable orders={all} />
    </div>
  );
}
