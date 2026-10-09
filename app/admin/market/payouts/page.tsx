import Link from 'next/link';
import { listPayouts, listSellers } from '@/lib/shop/db';
import { dollars } from '@/lib/shop/money';
import { fmtDate } from '@/lib/admin/format';
import { Badge, Card, EmptyState, PageHeader, Stat } from '@/components/admin/ui';
import { ActionButton } from '@/components/admin/action';
import { transferNowAction } from '../actions';
import { PAYOUT_TONE } from '../tones';

export const dynamic = 'force-dynamic';

const LABEL = { held: 'On hold', due: 'Due', transferred: 'Sent', reversed: 'Reversed', canceled: 'Canceled' } as const;

export default async function PayoutsPage() {
  const [payouts, sellers] = await Promise.all([listPayouts(), listSellers()]);
  const names = new Map(sellers.map((s) => [s.id, s.name]));
  const sum = (st: string[]) => payouts.filter((p) => st.includes(p.status)).reduce((n, p) => n + p.amount_cents, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Market"
        title="Payouts"
        description="Each business's share waits 14 days after the hat ships or is picked up, then goes out automatically every morning."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="On hold" value={dollars(sum(['held']))} />
        <Stat label="Due now" value={dollars(sum(['due']))} sub="waiting on a business to connect, or failed" />
        <Stat label="Sent" value={dollars(sum(['transferred']))} />
      </div>
      {payouts.length === 0 ? (
        <EmptyState title="No payouts yet" body="They appear here the moment a market order is paid." />
      ) : (
        <Card>
          <ul className="divide-y divide-town-cream/[0.07]">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm text-town-cream">
                    {p.recipient === 'royalbacks' ? 'RoyalBacks (Dylan)' : (names.get(p.seller_id ?? '') ?? 'Business')}{' '}
                    <span className="tabular-nums">· {dollars(p.amount_cents)}</span>
                  </p>
                  <p className="text-xs text-town-cream/50">
                    <Link href={`/admin/orders/m-${p.order_id}`} className="hover:underline">
                      Order from {fmtDate(p.created_at)}
                    </Link>
                    {p.status === 'held' && (p.release_at ? ` · releases ${fmtDate(p.release_at)}` : ' · clock starts when it ships')}
                    {p.error && <span className="text-red-300"> · {p.error}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={PAYOUT_TONE[p.status]}>{LABEL[p.status]}</Badge>
                  {(p.status === 'held' || p.status === 'due') && (
                    <ActionButton look="ghost" action={transferNowAction.bind(null, p.id)} confirm="Send this payout now, before the 14 days are up?">
                      Send now
                    </ActionButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
