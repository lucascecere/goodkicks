import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listPayouts, listProducts, listSellers } from '@/lib/shop/db';
import { dollars } from '@/lib/shop/money';
import { SELLER_STATUS_LABEL, type Seller } from '@/lib/shop/types';
import { STATUS_TONE } from './tones';
import { shopStripeConfigured, shopIsTestMode } from '@/lib/shop/config';
import { MARKET_BASE } from '@/lib/shop/paths';
import { Badge, Card, EmptyState, PageHeader, Stat, btn } from '@/components/admin/ui';
import { SellerMark } from '@/components/market/seller-mark';
import { ReorderButton } from './reorder-button';

export const dynamic = 'force-dynamic';


function setupLine(s: Seller, priced: number): string {
  if (s.status === 'applied') return 'Applied, waiting on review';
  const steps = [];
  if (!s.invited_at && !s.joined_at) steps.push('invite not sent');
  if (!s.joined_at && s.invited_at) steps.push('invited, not joined yet');
  if (!priced) steps.push('no hats priced');
  if (!s.payouts_enabled) steps.push('payouts not connected');
  return steps.length ? steps.join(' · ') : 'Ready';
}

export default async function MarketAdminPage() {
  const [sellers, products, payouts] = await Promise.all([listSellers(), listProducts(), listPayouts({ statuses: ['held', 'due'] })]);

  const hatsBySeller = new Map<string, typeof products>();
  for (const p of products) hatsBySeller.set(p.seller_id, [...(hatsBySeller.get(p.seller_id) ?? []), p]);
  const sellerById = new Map(sellers.map((s) => [s.id, s]));

  const live = sellers.filter((s) => s.status === 'live');
  const applied = sellers.filter((s) => s.status === 'applied');
  const owed = payouts.reduce((n, p) => n + p.amount_cents, 0);
  const low = products
    .filter((p) => p.status === 'active' && p.on_hand < p.stock_buffer && sellerById.has(p.seller_id))
    .sort((a, b) => a.on_hand - b.on_hand);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Market"
        title="Local market"
        description={
          <>
            Local businesses selling their hats at{' '}
            <a href={MARKET_BASE} target="_blank" className="underline">
              townies.shop{MARKET_BASE}
            </a>
            .
          </>
        }
        right={
          <Link href="/admin/market/sellers/new" className={btn.primary}>
            <Plus className="h-4 w-4" /> Add business
          </Link>
        }
      />

      {!shopStripeConfigured() ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Stripe isn&rsquo;t connected yet, so checkout and payouts are off. Set SHOP_STRIPE_SECRET_KEY to turn them on.
        </p>
      ) : shopIsTestMode() ? (
        <p className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-200">Test mode: no real money moves.</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open stalls" value={live.length} sub={`${sellers.length} businesses total`} />
        <Stat label="Applications" value={applied.length} sub={applied.length ? 'waiting on you' : 'none waiting'} />
        <Stat label="Owed to businesses" value={dollars(owed)} sub={`${payouts.length} payout${payouts.length === 1 ? '' : 's'} on hold`} href="/admin/market/payouts" />
        <Stat label="Below buffer" value={low.length} sub="hats to reorder" href="#low" />
      </div>

      {low.length > 0 && (
        <Card title="Below buffer" className="scroll-mt-6" action={<Link href="/admin/market/reorders" className="text-xs text-town-cream/50 hover:text-town-cream">Reorders →</Link>}>
          <ul id="low" className="divide-y divide-town-cream/[0.07]">
            {low.map((p) => {
              const s = sellerById.get(p.seller_id)!;
              return (
                <li key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm text-town-cream">
                      {s.name} · {p.title}
                    </p>
                    <p className={`text-xs ${p.on_hand < 0 ? 'text-red-300' : 'text-amber-300'}`}>
                      {p.on_hand < 0 ? `${-p.on_hand} sold that we don't have` : `${p.on_hand} on hand`} · buffer {p.stock_buffer}
                    </p>
                  </div>
                  <ReorderButton productId={p.id} suggested={Math.max(1, p.stock_buffer - p.on_hand)} />
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {sellers.length === 0 ? (
        <EmptyState
          title="No businesses yet"
          body="Add a hat client, upload their designs, and send them their join link."
          action={
            <Link href="/admin/market/sellers/new" className={btn.primary}>
              Add the first business
            </Link>
          }
        />
      ) : (
        <Card title={`Businesses · ${sellers.length}`}>
          <ul className="divide-y divide-town-cream/[0.07]">
            {sellers.map((s) => {
              const hats = hatsBySeller.get(s.id) ?? [];
              const priced = hats.filter((h) => h.status === 'active' && h.price_cents).length;
              return (
                <li key={s.id}>
                  <Link href={`/admin/market/sellers/${s.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5">
                    <SellerMark seller={s} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-town-cream">
                        {s.name}
                        {s.town && <span className="font-normal text-town-cream/50"> · {s.town}</span>}
                      </p>
                      <p className="truncate text-xs text-town-cream/50">
                        {priced}/{hats.length} hats selling · {setupLine(s, priced)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.is_royalbacks_sourced && <span className="hidden sm:inline"><Badge>RoyalBacks</Badge></span>}
                      <Badge tone={STATUS_TONE[s.status]}>{SELLER_STATUS_LABEL[s.status]}</Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
