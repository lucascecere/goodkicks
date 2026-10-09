import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getSeller, listPayouts, listProducts } from '@/lib/shop/db';
import { dollars } from '@/lib/shop/money';
import { siteUrl } from '@/lib/shop/config';
import { MARKET_BASE } from '@/lib/shop/paths';
import { SELLER_STATUS_LABEL } from '@/lib/shop/types';
import { fmtDate } from '@/lib/admin/format';
import { Badge, Card, PageHeader, Row, btn, field } from '@/components/admin/ui';
import { ActionButton, ActionForm } from '@/components/admin/action';
import { SellerMark } from '@/components/market/seller-mark';
import {
  addProductAction,
  refreshStripeAction,
  sendInviteAction,
  setSellerStatusAction,
  stripeDashboardAction,
  updateSellerAction,
} from '../../actions';
import { STATUS_TONE, PAYOUT_TONE } from '../../tones';
import { HatRow } from './hat-row';
import { CopyLink } from './copy-link';

export const dynamic = 'force-dynamic';

const label = 'admin-eyebrow mb-1.5 block';
const fileInput = `${field} file:mr-3 file:border-0 file:bg-town-cream file:px-2 file:py-1 file:text-xs file:text-town-navy`;

export default async function SellerAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller || seller.kind !== 'local') notFound();
  const [hats, payouts] = await Promise.all([listProducts(seller.id), listPayouts({ sellerId: seller.id })]);

  const joinUrl = seller.invite_token ? `${siteUrl()}${MARKET_BASE}/join/${seller.invite_token}` : null;
  const selling = hats.filter((h) => h.status === 'active' && h.price_cents);
  const earned = payouts.filter((p) => p.status === 'transferred').reduce((n, p) => n + p.amount_cents, 0);
  const pending = payouts.filter((p) => p.status === 'held' || p.status === 'due').reduce((n, p) => n + p.amount_cents, 0);
  const canGoLive = selling.length > 0 && seller.payouts_enabled;
  const app = seller.application as { about?: string; has_logo?: string } | null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        back={{ href: '/admin/market', label: 'Market' }}
        eyebrow={seller.town ?? 'Business'}
        title={seller.name}
        right={
          <>
            <Badge tone={STATUS_TONE[seller.status]}>{SELLER_STATUS_LABEL[seller.status]}</Badge>
            {seller.status === 'live' && (
              <a href={`${MARKET_BASE}/${seller.slug}`} target="_blank" className={btn.ghost}>
                View shop <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {seller.status === 'applied' && (
            <Card title="Application">
              <div className="space-y-3 px-4 py-4 text-sm sm:px-5">
                <p className="whitespace-pre-wrap text-town-cream/85">{app?.about ?? '—'}</p>
                <p className="text-town-cream/50">Has a logo file: {app?.has_logo?.replace('_', ' ') ?? '—'}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <ActionButton look="primary" action={setSellerStatusAction.bind(null, seller.id, 'approved')}>
                    Approve
                  </ActionButton>
                  <ActionButton action={setSellerStatusAction.bind(null, seller.id, 'rejected')} confirm={`Turn down ${seller.name}?`}>
                    Turn down
                  </ActionButton>
                </div>
              </div>
            </Card>
          )}

          <Card title={`Hats · ${selling.length} selling of ${hats.length}`}>
            {hats.length === 0 ? (
              <p className="px-5 py-6 text-sm text-town-cream/50">Add their designs below. They set prices on their join link.</p>
            ) : (
              <ul className="divide-y divide-town-cream/[0.07]">
                {hats.map((h) => (
                  <HatRow key={h.id} hat={h} />
                ))}
              </ul>
            )}
            <details className="border-t border-town-cream/10">
              <summary className="cursor-pointer px-4 py-3 font-label text-xs font-bold uppercase tracking-[0.14em] text-town-cream/70 hover:text-town-cream sm:px-5">
                + Add a hat
              </summary>
              <ActionForm action={addProductAction.bind(null, seller.id)} resetOnSuccess className="grid gap-3 px-4 pb-4 sm:grid-cols-2 sm:px-5">
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="title">Hat name *</label>
                  <input id="title" name="title" required className={field} placeholder="Navy Rope Hat" />
                </div>
                <div>
                  <label className={label} htmlFor="wholesale_type">Type</label>
                  <select id="wholesale_type" name="wholesale_type" className={field}>
                    <option value="everyday">Everyday ($22 to us)</option>
                    <option value="lifestyle">Lifestyle ($24 to us)</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="on_hand">On hand now</label>
                  <input id="on_hand" name="on_hand" type="number" defaultValue={0} className={field} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="image">Photo (white background works best)</label>
                  <input id="image" name="image" type="file" accept="image/*" className={fileInput} />
                </div>
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="description">Short description</label>
                  <input id="description" name="description" className={field} />
                </div>
                <div>
                  <button type="submit" className={btn.primary}>Add hat</button>
                </div>
              </ActionForm>
            </details>
          </Card>

          <Card title="Details">
            <ActionForm action={updateSellerAction.bind(null, seller.id)} className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div>
                <label className={label} htmlFor="name">Name</label>
                <input id="name" name="name" defaultValue={seller.name} required className={field} />
              </div>
              <div>
                <label className={label} htmlFor="town">Town</label>
                <input id="town" name="town" defaultValue={seller.town ?? ''} className={field} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="blurb">Blurb</label>
                <textarea id="blurb" name="blurb" rows={2} defaultValue={seller.blurb ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="contact_name">Contact</label>
                <input id="contact_name" name="contact_name" defaultValue={seller.contact_name ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="contact_email">Email</label>
                <input id="contact_email" name="contact_email" type="email" defaultValue={seller.contact_email ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="contact_phone">Phone</label>
                <input id="contact_phone" name="contact_phone" defaultValue={seller.contact_phone ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="website">Website</label>
                <input id="website" name="website" defaultValue={seller.website ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="instagram">Instagram</label>
                <input id="instagram" name="instagram" defaultValue={seller.instagram ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="logo">Replace logo</label>
                <input id="logo" name="logo" type="file" accept="image/*" className={fileInput} />
              </div>
              <label className="flex items-center gap-2 text-sm text-town-cream/80 sm:col-span-2">
                <input type="checkbox" name="pickup_enabled" defaultChecked={seller.pickup_enabled} /> Free pickup at their place
              </label>
              <div>
                <label className={label} htmlFor="pickup_address">Pickup address</label>
                <input id="pickup_address" name="pickup_address" defaultValue={seller.pickup_address ?? ''} className={field} />
              </div>
              <div>
                <label className={label} htmlFor="pickup_notes">Pickup notes</label>
                <input id="pickup_notes" name="pickup_notes" defaultValue={seller.pickup_notes ?? ''} className={field} />
              </div>
              <label className="flex items-center gap-2 text-sm text-town-cream/80">
                <input type="checkbox" name="is_royalbacks_sourced" defaultChecked={seller.is_royalbacks_sourced} /> RoyalBacks-sourced ($5 a hat to Dylan)
              </label>
              <div>
                <label className={label} htmlFor="sort">Order on the market page</label>
                <input id="sort" name="sort" type="number" defaultValue={seller.sort} className={field} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className={btn.primary}>Save details</button>
              </div>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
              <SellerMark seller={seller} size={56} />
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-town-cream">{seller.contact_name ?? 'No contact yet'}</p>
                <p className="truncate text-town-cream/55">{seller.contact_email ?? 'Add an email to invite them'}</p>
              </div>
            </div>
          </Card>

          <Card title="Open the shop">
            <div className="space-y-4 px-4 py-4 sm:px-5">
              <ol className="space-y-1.5 text-sm">
                <li className={seller.invited_at || seller.joined_at ? 'text-town-cream' : 'text-town-cream/50'}>
                  {seller.invited_at || seller.joined_at ? '✓' : '1.'} Invite sent{seller.invited_at ? ` ${fmtDate(seller.invited_at)}` : ''}
                </li>
                <li className={selling.length ? 'text-town-cream' : 'text-town-cream/50'}>
                  {selling.length ? '✓' : '2.'} Hats priced ({selling.length})
                </li>
                <li className={seller.payouts_enabled ? 'text-town-cream' : 'text-town-cream/50'}>
                  {seller.payouts_enabled ? '✓' : '3.'} Payouts connected
                </li>
              </ol>
              {seller.status !== 'applied' && seller.status !== 'rejected' && (
                <div className="flex flex-wrap gap-2">
                  <ActionButton look={seller.invited_at ? 'secondary' : 'primary'} action={sendInviteAction.bind(null, seller.id)}>
                    {seller.invited_at ? 'Resend invite' : 'Send invite'}
                  </ActionButton>
                  {joinUrl && <CopyLink url={joinUrl} />}
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t border-town-cream/10 pt-4">
                {seller.status === 'live' ? (
                  <ActionButton action={setSellerStatusAction.bind(null, seller.id, 'paused')} confirm="Hide this shop from the market?">
                    Pause shop
                  </ActionButton>
                ) : seller.status === 'approved' || seller.status === 'paused' ? (
                  <ActionButton look="primary" action={setSellerStatusAction.bind(null, seller.id, 'live')}>
                    {seller.status === 'paused' ? 'Reopen shop' : 'Open shop'}
                  </ActionButton>
                ) : null}
              </div>
              {seller.status === 'approved' && !canGoLive && (
                <p className="text-xs text-town-cream/45">
                  You can open it now, but buyers only see it once a hat is priced. Payouts wait until they connect.
                </p>
              )}
            </div>
          </Card>

          <Card title="Payouts">
            <div className="px-4 py-3 sm:px-5">
              <Row label="Stripe">
                {seller.payouts_enabled ? <Badge tone="good">Connected</Badge> : seller.stripe_account_id ? <Badge tone="warn">Started</Badge> : <Badge>Not started</Badge>}
              </Row>
              <Row label="Paid out">{dollars(earned)}</Row>
              <Row label="On hold">{dollars(pending)}</Row>
            </div>
            {seller.stripe_account_id && (
              <div className="flex flex-wrap gap-2 border-t border-town-cream/10 px-4 py-3 sm:px-5">
                <ActionButton look="ghost" action={refreshStripeAction.bind(null, seller.id)}>
                  Check status
                </ActionButton>
                <ActionButton look="ghost" openResult action={stripeDashboardAction.bind(null, seller.id)}>
                  Their Stripe
                </ActionButton>
              </div>
            )}
            {payouts.length > 0 && (
              <ul className="divide-y divide-town-cream/[0.07] border-t border-town-cream/10">
                {payouts.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm sm:px-5">
                    <Link href={`/admin/orders/m-${p.order_id}`} className="text-town-cream/70 hover:underline">
                      {fmtDate(p.created_at)}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-town-cream">{dollars(p.amount_cents)}</span>
                      <Badge tone={PAYOUT_TONE[p.status]}>{p.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
