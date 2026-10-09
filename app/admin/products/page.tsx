import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { getAdminBrand } from '@/lib/admin/brand-server';
import { money } from '@/lib/admin/format';
import { listShopifyProducts, type AdminProduct } from '@/lib/admin/products';
import { Badge, Card, EmptyState, PageHeader, field } from '@/components/admin/ui';
import { listProducts, listSellers } from '@/lib/shop/db';
import { dollars } from '@/lib/shop/money';
import { ActionButton } from '@/components/admin/action';
import { importShopifyAction } from '@/app/admin/market/actions';

export const dynamic = 'force-dynamic';

const LOW = 3;

const VIEWS = [
  { id: 'active', label: 'Active' },
  { id: 'low', label: 'Low stock' },
  { id: 'draft', label: 'Drafts' },
  { id: 'all', label: 'All' },
] as const;
type View = (typeof VIEWS)[number]['id'];

function isLow(p: AdminProduct): boolean {
  return p.status === 'ACTIVE' && !p.preorder && p.variants.some((v) => v.stock !== null && v.stock <= LOW);
}

function inView(p: AdminProduct, view: View): boolean {
  if (view === 'active') return p.status === 'ACTIVE';
  if (view === 'draft') return p.status !== 'ACTIVE';
  if (view === 'low') return isLow(p);
  return true;
}

function price(p: AdminProduct): string {
  return p.priceMin === p.priceMax ? money(p.priceMin) : `${money(p.priceMin)}–${money(p.priceMax)}`;
}

function StockCell({ p }: { p: AdminProduct }) {
  if (p.preorder) return <Badge tone="info">Pre-order</Badge>;
  if (p.totalStock === null) return <span className="text-town-cream/40">Not tracked</span>;
  const low = isLow(p);
  return (
    <span className={low ? 'text-amber-300' : 'text-town-cream/80'}>
      {p.totalStock} on hand
      {p.variants.length > 1 && (
        <span className="text-town-cream/40"> · {p.variants.length} options</span>
      )}
    </span>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const view: View = (VIEWS.find((v) => v.id === sp.view)?.id ?? 'active') as View;
  const q = (sp.q ?? '').trim().toLowerCase();

  const brand = await getAdminBrand();
  const [{ products, configured, error }, marketHats, sellers] = await Promise.all([
    listShopifyProducts(),
    brand === 'goodkicks' ? Promise.resolve([]) : listProducts().catch(() => []),
    brand === 'goodkicks' ? Promise.resolve([]) : listSellers({ includeHouse: true }).catch(() => []),
  ]);
  const houseId = sellers.find((x) => x.kind === 'house')?.id;
  const copied = marketHats.filter((h) => h.seller_id === houseId);
  const lastCopy = copied.reduce((m, h) => (h.updated_at > m ? h.updated_at : m), '');
  const sellerName = new Map(sellers.map((x) => [x.id, x.name]));
  const market = marketHats
    .filter((h) => h.status !== 'archived' && sellerName.has(h.seller_id) && h.seller_id !== houseId)
    .filter((h) => !q || `${h.title} ${sellerName.get(h.seller_id)}`.toLowerCase().includes(q));
  const scoped = products.filter((p) => brand === 'all' || p.brand === brand);
  const counts = Object.fromEntries(VIEWS.map((v) => [v.id, scoped.filter((p) => inView(p, v.id)).length]));
  const shown = scoped.filter((p) => inView(p, view) && (!q || `${p.title} ${p.tags.join(' ')}`.toLowerCase().includes(q)));

  const href = (v: View) => {
    const p = new URLSearchParams();
    if (v !== 'active') p.set('view', v);
    if (q) p.set('q', q);
    const s = p.toString();
    return `/admin/products${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader
        eyebrow="Products"
        title="Products"
        description="Town hats and Good Kicks are still managed in Shopify; tap one to edit it there. Market hats are listed at the bottom and edited on each business's page."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={href(v.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                view === v.id ? 'bg-town-cream text-town-navy' : 'border border-town-cream/15 text-town-cream/60 hover:text-town-cream'
              }`}
            >
              {v.label}
              <span className={view === v.id ? 'text-town-navy/60' : 'text-town-cream/35'}>{counts[v.id]}</span>
            </Link>
          ))}
        </div>
        <form action="/admin/products" className="sm:w-72">
          {view !== 'active' && <input type="hidden" name="view" value={view} />}
          <input name="q" defaultValue={sp.q ?? ''} placeholder="Search hats…" className={field} />
        </form>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>
      )}

      {!configured ? (
        <EmptyState title="Shopify isn't connected" body="The Admin API env vars aren't set in this environment." />
      ) : shown.length === 0 ? (
        <EmptyState title="No products here" body="Try another tab or search." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-town-cream/10">
          <ul className="divide-y divide-town-cream/[0.07]">
            {shown.map((p) => (
              <li key={p.id}>
                <a
                  href={p.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-town-cream">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt="" className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-town-cream">{p.title}</p>
                    <p className="mt-0.5 text-xs">
                      <StockCell p={p} />
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {p.status !== 'ACTIVE' && <Badge>{p.status.toLowerCase()}</Badge>}
                    {brand === 'all' && <Badge tone={p.brand === 'goodkicks' ? 'warn' : 'neutral'}>{p.brand === 'goodkicks' ? 'Good Kicks' : 'Townies'}</Badge>}
                  </div>
                  <p className="w-24 shrink-0 text-right text-sm tabular-nums text-town-cream/80">{price(p)}</p>
                  <ExternalLink className="h-4 w-4 shrink-0 text-town-cream/30 group-hover:text-town-cream/70" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brand !== 'goodkicks' && (
        <Card title="Moving off Shopify" className="mt-8">
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-town-cream/70">
              {copied.length
                ? `${copied.length} products copied into our own system as hidden drafts${lastCopy ? `, last refreshed ${new Date(lastCopy).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}. Shopify is still what sells them.`
                : 'Copy your Shopify products into our own system as hidden drafts. Nothing in Shopify changes and nothing new shows on the site.'}
            </p>
            <ActionButton action={importShopifyAction}>{copied.length ? 'Refresh from Shopify' : 'Copy from Shopify'}</ActionButton>
          </div>
        </Card>
      )}

      {market.length > 0 && (
        <Card title={`Market hats · ${market.length}`} className="mt-8">
          <ul className="divide-y divide-town-cream/[0.07]">
            {market.map((h) => (
              <li key={h.id}>
                <Link href={`/admin/market/sellers/${h.seller_id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-town-cream/[0.04] sm:px-5">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-town-cream">
                    {h.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.image_url} alt="" className="h-full w-full object-contain mix-blend-multiply" loading="lazy" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-town-cream">
                      {h.title} <span className="font-normal text-town-cream/50">· {sellerName.get(h.seller_id)}</span>
                    </p>
                    <p className={`mt-0.5 text-xs ${h.on_hand < h.stock_buffer ? 'text-amber-300' : 'text-town-cream/60'}`}>
                      {h.on_hand} on hand · buffer {h.stock_buffer}
                    </p>
                  </div>
                  {h.status !== 'active' && <Badge tone="warn">Not selling</Badge>}
                  <p className="w-24 shrink-0 text-right text-sm tabular-nums text-town-cream/80">{h.price_cents ? dollars(h.price_cents) : 'No price'}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
