import { listProducts, listReorders, listSellers } from '@/lib/shop/db';
import { fmtDate } from '@/lib/admin/format';
import { Badge, Card, EmptyState, PageHeader } from '@/components/admin/ui';
import { ActionButton } from '@/components/admin/action';
import { cancelReorderAction, receiveReorderAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ReordersPage() {
  const [reorders, products, sellers] = await Promise.all([listReorders(), listProducts(), listSellers()]);
  const product = new Map(products.map((p) => [p.id, p]));
  const seller = new Map(sellers.map((s) => [s.id, s]));
  const open = reorders.filter((r) => r.status === 'requested');
  const done = reorders.filter((r) => r.status !== 'requested');

  const row = (r: (typeof reorders)[number]) => {
    const p = product.get(r.product_id);
    const s = p ? seller.get(p.seller_id) : undefined;
    return (
      <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-sm text-town-cream">
            {r.qty} × {s?.name ?? 'Business'} · {p?.title ?? 'Hat'}
          </p>
          <p className="text-xs text-town-cream/50">
            Asked {fmtDate(r.requested_at)}
            {r.received_at && ` · received ${fmtDate(r.received_at)}`}
            {r.note && ` · ${r.note}`}
          </p>
        </div>
        {r.status === 'requested' ? (
          <div className="flex gap-2">
            <ActionButton look="primary" action={receiveReorderAction.bind(null, r.id)}>
              Received, add to stock
            </ActionButton>
            <ActionButton look="ghost" action={cancelReorderAction.bind(null, r.id)} confirm="Cancel this reorder?">
              Cancel
            </ActionButton>
          </div>
        ) : (
          <Badge tone={r.status === 'received' ? 'good' : 'neutral'}>{r.status}</Badge>
        )}
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Market"
        title="Reorders"
        description="Hats asked from RoyalBacks. When a box arrives, mark it received and the count goes back on the shelf."
      />
      {reorders.length === 0 ? (
        <EmptyState title="No reorders yet" body="Use Reorder from RoyalBacks on any hat that drops below its buffer." />
      ) : (
        <>
          <Card title={`Waiting on RoyalBacks · ${open.length}`}>
            {open.length ? <ul className="divide-y divide-town-cream/[0.07]">{open.map(row)}</ul> : <p className="px-5 py-6 text-sm text-town-cream/50">Nothing outstanding.</p>}
          </Card>
          {done.length > 0 && (
            <Card title="History">
              <ul className="divide-y divide-town-cream/[0.07]">{done.map(row)}</ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
