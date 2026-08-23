'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BrandBadge } from '@/components/admin/brand-badge';
import { RepTabs } from '../rep-tabs';
import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import { money, fmtDate } from '@/lib/admin/format';

export type SalesRow = {
  id: string;
  name: string;
  email: string;
  brand: RealBrand;
  discountCode: string;
  discountPct: number;
  commissionPct: number;
  orders: number;
  revenue: number;
  commission: number;
  lastOrderAt: string | null;
};

type SortKey = 'revenue' | 'orders' | 'commission' | 'name' | 'lastOrderAt';

export function SalesClient({
  rows,
  brand,
  truncated,
  shopifyConfigured,
  partnerPanel,
}: {
  rows: SalesRow[];
  brand: AdminBrand;
  truncated: boolean;
  shopifyConfigured: boolean;
  /** Rendered on the server — see partner-panel.tsx. */
  partnerPanel?: ReactNode;
}) {
  const [sort, setSort] = useState<SortKey>('revenue');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.discountCode.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'lastOrderAt') return (b.lastOrderAt ?? '').localeCompare(a.lastOrderAt ?? '');
      return b[sort] - a[sort];
    });
  }, [rows, search, sort]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({
          orders: acc.orders + r.orders,
          revenue: acc.revenue + r.revenue,
          commission: acc.commission + r.commission,
        }),
        { orders: 0, revenue: 0, commission: 0 },
      ),
    [filtered],
  );

  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'orders', label: 'Orders' },
    { key: 'commission', label: 'Commission owed' },
    { key: 'lastOrderAt', label: 'Most recent' },
    { key: 'name', label: 'Name' },
  ];

  return (
    <div className="min-h-full">
      <div className="px-4 sm:px-6 pt-5 pb-4">
        <h1 className="font-display text-2xl text-white mb-0.5">Rep Sales</h1>
        <p className="text-white/40 text-xs">
          Revenue driven by each rep&apos;s discount code. Commission is a percentage of what
          customers actually paid, for that rep&apos;s brand only. Updates every 5 minutes.
        </p>
      </div>

      <div className="px-4 sm:px-6">
        <RepTabs active="sales" />
      </div>

      {partnerPanel}

      {!shopifyConfigured && (
        <div className="mx-4 sm:mx-6 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
          <p className="text-amber-200 text-xs">
            Shopify Admin API isn&apos;t configured (SHOPIFY_ADMIN_API_TOKEN / SHOPIFY_STORE_DOMAIN),
            so every total below reads zero.
          </p>
        </div>
      )}
      {truncated && (
        <div className="mx-4 sm:mx-6 mb-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
          <p className="text-white/50 text-xs">
            Order history hit the page limit — totals cover the most recent 5,000 orders.
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Reps with codes', value: String(filtered.length) },
          { label: 'Orders driven', value: String(totals.orders) },
          { label: 'Revenue driven', value: money(totals.revenue) },
          { label: 'Commission owed', value: money(totals.commission) },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{s.label}</p>
            <p className="text-white text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-4 sm:px-6 flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search name, email, code…"
          className="flex-1 bg-white/8 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                sort === s.key ? 'bg-white text-[#1A1A1A]' : 'bg-white/8 text-white/50 hover:text-white hover:bg-white/12'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6 pb-8">
        {filtered.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center">
            <p className="text-white/50 text-sm">
              {rows.length === 0
                ? `No approved ${brand === 'townies' ? 'Town Reps' : 'reps'} with a discount code yet.`
                : 'No results.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-rule text-left">
                    {['Rep', 'Code', 'Off / Earns', 'Orders', 'Revenue', 'Commission', 'Last order', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-wider text-brand-muted font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-rule">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-brand-rule/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <p className="text-brand-ink font-medium truncate">{r.name}</p>
                            <p className="text-brand-muted text-xs truncate">{r.email}</p>
                          </div>
                          {brand === 'all' && <BrandBadge brand={r.brand} />}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-ink">{r.discountCode}</td>
                      <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">
                        {r.discountPct}% off / {r.commissionPct}%
                      </td>
                      <td className="px-4 py-3 text-brand-ink">{r.orders}</td>
                      <td className="px-4 py-3 text-brand-ink">{money(r.revenue)}</td>
                      <td className="px-4 py-3 text-brand-ink font-semibold">{money(r.commission)}</td>
                      <td className="px-4 py-3 text-brand-muted text-xs whitespace-nowrap">{fmtDate(r.lastOrderAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/admin/ambassadors/${r.id}`} className="text-xs text-brand-rust hover:underline">
                          manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-brand-rule">
              {filtered.map((r) => (
                <Link key={r.id} href={`/admin/ambassadors/${r.id}`} className="block px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-brand-ink font-medium text-sm truncate">{r.name}</p>
                      <p className="font-mono text-[11px] text-brand-muted">{r.discountCode}</p>
                    </div>
                    {brand === 'all' && <BrandBadge brand={r.brand} />}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Orders', value: String(r.orders) },
                      { label: 'Revenue', value: money(r.revenue) },
                      { label: 'Owed', value: money(r.commission) },
                    ].map((s) => (
                      <div key={s.label} className="bg-brand-rule/30 rounded-lg py-2">
                        <p className="text-[9px] uppercase tracking-wider text-brand-muted">{s.label}</p>
                        <p className="text-brand-ink text-sm font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
