'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BrandBadge } from '@/components/admin/brand-badge';
import { RepTabs } from '../rep-tabs';
import type { AdminBrand, RealBrand } from '@/lib/admin/brand';
import { money, fmtDate } from '@/lib/admin/format';
import { EmptyState, PageHeader, Stat, field } from '@/components/admin/ui';

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Reps"
        title="Rep Sales"
        description={
          <>
            Revenue driven by each rep&apos;s discount code. Commission is a percentage of what
            customers actually paid, for that rep&apos;s brand only. Updates every 5 minutes.
          </>
        }
      />

      <RepTabs active="sales" />

      {partnerPanel}

      {!shopifyConfigured && (
        <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
          <p className="text-xs text-amber-200">
            Shopify Admin API isn&apos;t configured (SHOPIFY_ADMIN_API_TOKEN / SHOPIFY_STORE_DOMAIN),
            so every total below reads zero.
          </p>
        </div>
      )}
      {truncated && (
        <div className="mb-4 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] px-4 py-3">
          <p className="text-xs text-town-cream/55">
            Order history hit the page limit — totals cover the most recent 5,000 orders.
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reps with codes" value={String(filtered.length)} />
        <Stat label="Orders driven" value={String(totals.orders)} />
        <Stat label="Revenue driven" value={money(totals.revenue)} />
        <Stat label="Commission owed" value={money(totals.commission)} />
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search name, email, code…"
          className={`${field} sm:flex-1`}
        />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                sort === s.key ? 'bg-town-cream text-town-navy' : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title={
            rows.length === 0
              ? `No approved ${brand === 'townies' ? 'Town Reps' : 'reps'} with a discount code yet.`
              : 'No results.'
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-town-cream/10 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-town-cream/10 bg-town-cream/[0.03] text-left">
                  {['Rep', 'Code', 'Off / Earns', 'Orders', 'Revenue', 'Commission', 'Last order', ''].map((h) => (
                    <th key={h} className="admin-eyebrow px-4 py-3 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-town-cream/[0.07] transition-colors last:border-0 hover:bg-town-cream/[0.04]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-town-cream">{r.name}</p>
                          <p className="truncate text-xs text-town-cream/50">{r.email}</p>
                        </div>
                        {brand === 'all' && <BrandBadge brand={r.brand} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-town-cream">{r.discountCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-town-cream/55">
                      {r.discountPct}% off / {r.commissionPct}%
                    </td>
                    <td className="px-4 py-3 text-town-cream tabular-nums">{r.orders}</td>
                    <td className="px-4 py-3 text-town-cream tabular-nums">{money(r.revenue)}</td>
                    <td className="px-4 py-3 font-semibold text-town-cream tabular-nums">{money(r.commission)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-town-cream/55">{fmtDate(r.lastOrderAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/admin/ambassadors/${r.id}`} className="text-xs font-semibold text-town-cream hover:underline">
                        manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/admin/ambassadors/${r.id}`}
                className="block rounded-xl border border-town-cream/10 bg-town-cream/[0.04] px-4 py-3.5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-town-cream">{r.name}</p>
                    <p className="font-mono text-[11px] text-town-cream/50">{r.discountCode}</p>
                  </div>
                  {brand === 'all' && <BrandBadge brand={r.brand} />}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Orders', value: String(r.orders) },
                    { label: 'Revenue', value: money(r.revenue) },
                    { label: 'Owed', value: money(r.commission) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-town-cream/[0.07] py-2">
                      <p className="text-[9px] uppercase tracking-wider text-town-cream/45">{s.label}</p>
                      <p className="text-sm font-semibold text-town-cream tabular-nums">{s.value}</p>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
