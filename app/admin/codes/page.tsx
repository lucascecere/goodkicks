import Link from 'next/link';
import { db } from '@/lib/shop/db';
import { fmtDate } from '@/lib/admin/format';
import { Badge, Card, EmptyState, PageHeader, btn, field, type BadgeTone } from '@/components/admin/ui';
import { ActionButton, ActionForm } from '@/components/admin/action';
import { createCodeAction, importCodesAction, setCodeActiveAction } from './actions';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  code: string;
  kind: 'percent' | 'fixed' | 'free_shipping';
  value: number;
  scope: 'all' | 'hats' | 'foot_bags';
  min_subtotal_cents: number;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  source: string;
  note: string | null;
  active: boolean;
  shopify_discount_id: string | null;
};

const SOURCE: Record<string, { label: string; tone: BadgeTone }> = {
  rep: { label: 'Rep', tone: 'info' },
  partner: { label: 'Partner', tone: 'good' },
  quiz: { label: 'Pop-up', tone: 'neutral' },
  welcome: { label: 'Welcome', tone: 'neutral' },
  manual: { label: 'Made here', tone: 'neutral' },
  shopify_import: { label: 'From Shopify', tone: 'neutral' },
};

function what(r: Row): string {
  const off = r.kind === 'percent' ? `${r.value}% off` : r.kind === 'fixed' ? `$${(r.value / 100).toFixed(2).replace(/\.00$/, '')} off` : 'Free shipping';
  const on = r.scope === 'hats' ? 'town hats' : r.scope === 'foot_bags' ? 'Good Kicks' : 'everything';
  return `${off} ${r.kind === 'free_shipping' ? '' : on}`.trim();
}

const label = 'admin-eyebrow mb-1.5 block';

export default async function CodesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'active' } = await searchParams;
  const { data } = await db().from('shop_discounts').select('*').order('created_at', { ascending: false });
  const rows = (data ?? []) as Row[];
  const now = Date.now();
  const working = (r: Row) => r.active && !(r.usage_limit !== null && r.used_count >= r.usage_limit) && !(r.ends_at && Date.parse(r.ends_at) <= now);
  const shown = view === 'all' ? rows : rows.filter(working);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Marketing"
        title="Discount codes"
        description="Codes for our own checkout. Shopify still runs its own codes until the town hats move over; copy them here to keep the two in step. Codes never discount a local shop's hats."
        right={<ActionButton action={importCodesAction}>Copy from Shopify</ActionButton>}
      />

      <details className="rounded-xl border border-town-cream/10 bg-town-cream/[0.04]">
        <summary className="cursor-pointer px-5 py-3 font-label text-xs font-bold uppercase tracking-[0.14em] text-town-cream/70 hover:text-town-cream">+ New code</summary>
        <ActionForm action={createCodeAction} resetOnSuccess className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="code">Code</label>
            <input id="code" name="code" required className={`${field} uppercase`} placeholder="SUMMER15" />
          </div>
          <div>
            <label className={label} htmlFor="kind">Type</label>
            <select id="kind" name="kind" className={field}>
              <option value="percent">Percent off</option>
              <option value="fixed">Dollars off</option>
              <option value="free_shipping">Free shipping</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="value">Amount (% or $)</label>
            <input id="value" name="value" inputMode="decimal" className={field} placeholder="15" />
          </div>
          <div>
            <label className={label} htmlFor="scope">Works on</label>
            <select id="scope" name="scope" className={field}>
              <option value="all">Everything Townies sells</option>
              <option value="hats">Town hats only</option>
              <option value="foot_bags">Good Kicks only</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="usage_limit">Total uses (blank = unlimited)</label>
            <input id="usage_limit" name="usage_limit" type="number" min={1} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="ends_at">Ends (optional)</label>
            <input id="ends_at" name="ends_at" type="date" className={field} />
          </div>
          <div>
            <label className={label} htmlFor="min">Minimum order $ (optional)</label>
            <input id="min" name="min" inputMode="decimal" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="note">Note</label>
            <input id="note" name="note" className={field} placeholder="Who it's for" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className={btn.primary}>Create code</button>
          </div>
        </ActionForm>
      </details>

      <div className="flex gap-1">
        {[
          ['active', 'Working'],
          ['all', 'All'],
        ].map(([id, l]) => (
          <Link
            key={id}
            href={id === 'active' ? '/admin/codes' : '/admin/codes?view=all'}
            className={`rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] ${
              view === id ? 'bg-town-cream text-town-navy' : 'border border-town-cream/15 text-town-cream/60'
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No codes yet" body="Make one above, or copy your Shopify codes over." />
      ) : (
        <Card>
          <ul className="divide-y divide-town-cream/[0.07]">
            {shown.map((r) => {
              const usedUp = r.usage_limit !== null && r.used_count >= r.usage_limit;
              return (
                <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-town-cream">{r.code}</p>
                    <p className="truncate text-xs text-town-cream/55">
                      {what(r)}
                      {r.min_subtotal_cents > 0 && ` · over $${(r.min_subtotal_cents / 100).toFixed(0)}`}
                      {' · '}
                      {r.used_count} used{r.usage_limit !== null ? ` of ${r.usage_limit}` : ''}
                      {r.ends_at && ` · ends ${fmtDate(r.ends_at)}`}
                      {r.note && ` · ${r.note}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={SOURCE[r.source]?.tone ?? 'neutral'}>{SOURCE[r.source]?.label ?? r.source}</Badge>
                    {usedUp ? (
                      <Badge>Used up</Badge>
                    ) : r.active ? (
                      <ActionButton look="ghost" action={setCodeActiveAction.bind(null, r.id, false)}>
                        Turn off
                      </ActionButton>
                    ) : (
                      <ActionButton look="ghost" action={setCodeActiveAction.bind(null, r.id, true)}>
                        Turn on
                      </ActionButton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
