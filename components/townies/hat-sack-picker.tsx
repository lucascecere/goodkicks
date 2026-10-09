'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useCart } from '@/lib/cart/cart-context';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { townKey } from '@/lib/townies/towns';
import { bundleTier, formatUsd, priceCents, sackName } from '@/lib/townies/hat-sack';
import type { HatSackOffer } from '@/lib/shopify/hat-sack-offer';


/**
 * Hat & Sack v2 (Lucas, 2026-10-08): pick any in-stock hat, pick any in-stock
 * Good Kicks foot bag, one price with shipping included. Both lists arrive
 * already filtered to what's on the shelf (lib/townies/hat-sack.ts).
 *
 * The line carries the picks two ways: visible `Hat` / `Foot bag` attributes
 * (the pick list on the Shopify order) and hidden `_hat_variant` /
 * `_sack_variant` ids, which the orders webhook uses to take one of each off
 * the shelf so neither oversells.
 */
const tile = 'relative aspect-square overflow-hidden bg-[#F1EEE8]';

function PickGrid({
  items,
  picked,
  onPick,
  label,
  name,
  sub,
}: {
  items: CollectionProduct[];
  picked: string | null;
  onPick: (handle: string) => void;
  label: string;
  name: (p: CollectionProduct) => string;
  sub: (p: CollectionProduct) => string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
      {items.map((p) => {
        const on = p.handle === picked;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(p.handle)}
            className={`group relative text-left outline-none transition ${on ? '' : 'opacity-95 hover:opacity-100'}`}
          >
            <div className={`${tile} ${on ? 'ring-2 ring-text' : 'ring-1 ring-transparent group-hover:ring-rule'}`}>
              {p.featuredImage?.url && (
                <Image
                  src={p.featuredImage.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 33vw, 160px"
                  className="object-contain p-[6%] mix-blend-multiply"
                />
              )}
              {on && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-text text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="mt-1.5 truncate text-[0.8125rem] font-semibold leading-tight text-text">{name(p)}</p>
            <p className="truncate text-[0.6875rem] text-muted">{sub(p)}</p>
          </button>
        );
      })}
    </div>
  );
}

export function HatSackPicker({
  hats,
  sacks,
  tiers,
  fromCents,
}: {
  hats: CollectionProduct[];
  sacks: CollectionProduct[];
  /** Live from Shopify; shipping is included in every tier. */
  tiers: HatSackOffer['tiers'];
  /** Cheapest tier purchasable with today's shelf (bundleFromCents). */
  fromCents: number;
}) {
  const { addItem, openCart } = useCart();
  const [hatHandle, setHatHandle] = useState<string | null>(null);
  const [sackHandle, setSackHandle] = useState<string | null>(null);
  const hat = hats.find((h) => h.handle === hatHandle) ?? null;
  const sack = sacks.find((s) => s.handle === sackHandle) ?? null;
  const separately = hat && sack ? (priceCents(hat) ?? 0) + (priceCents(sack) ?? 0) : null;
  // Price follows the picks (see bundleTier); before both are picked, show "from".
  const tier = hat && sack ? tiers[bundleTier(priceCents(hat), priceCents(sack))] : null;
  const bundleCents = tier?.cents ?? fromCents;
  const canAdd = Boolean(hat && sack && tier?.id);

  function handleAdd() {
    if (!hat || !sack || !tier?.id) return;
    addItem({
      // One line per hat + bag pair.
      cartKey: `hat-sack:${hat.handle}:${sack.handle}`,
      variantId: tier.id,
      variantName: `${hat.title} + ${sackName(sack)}`,
      productTitle: 'Hat & Sack Bundle',
      priceInCents: bundleCents,
      imageUrl: hat.featuredImage?.url ?? undefined,
      customAttributes: [
        { key: '_brand', value: 'townies' },
        { key: 'Hat', value: hat.title },
        { key: 'Foot bag', value: sack.title },
        { key: '_hat_variant', value: hat.variants.edges[0]?.node.id ?? '' },
        { key: '_sack_variant', value: sack.variants.edges[0]?.node.id ?? '' },
      ],
    });
    openCart();
    setHatHandle(null);
    setSackHandle(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
      <div className="space-y-10">
        <section>
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">01</p>
          <h2 className="display mt-1 text-[1.75rem] text-text">Pick your hat.</h2>
          <p className="mb-4 mt-1 text-[0.875rem] text-muted">Every hat we have on the shelf right now.</p>
          <PickGrid
            items={hats}
            picked={hatHandle}
            onPick={setHatHandle}
            label="Hat"
            name={(p) => townKey(p).name}
            sub={(p) => (p.title.toLowerCase().includes('everyday') ? 'Everyday' : 'Lifestyle')}
          />
        </section>
        <section>
          <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-text/60">02</p>
          <h2 className="display mt-1 text-[1.75rem] text-text">Pick your sack.</h2>
          <p className="mb-4 mt-1 text-[0.875rem] text-muted">Good Kicks foot bags, hand-stitched. Any one in stock.</p>
          <PickGrid
            items={sacks}
            picked={sackHandle}
            onPick={setSackHandle}
            label="Foot bag"
            name={sackName}
            sub={(p) => (/pro/i.test(p.title) ? 'Good Kicks Pro' : 'Good Kicks')}
          />
        </section>
      </div>

      {/* Summary: sticky on desktop, fixed bar on phones. */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="hidden border border-rule p-5 lg:block">
          <Summary hat={hat} sack={sack} bundleCents={bundleCents} priced={Boolean(tier)} separately={separately} canAdd={canAdd} onAdd={handleAdd} />
        </div>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white/95 px-4 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-semibold text-text">
              {hat ? townKey(hat).name : 'Pick a hat'} + {sack ? sackName(sack) : 'pick a sack'}
            </p>
            <p className="text-[0.75rem] text-muted">{tier ? formatUsd(bundleCents) : `From ${formatUsd(fromCents)}`} · shipping included</p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="shrink-0 bg-text px-5 py-3.5 font-label text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-40"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({
  hat,
  sack,
  bundleCents,
  priced,
  separately,
  canAdd,
  onAdd,
}: {
  hat: CollectionProduct | null;
  sack: CollectionProduct | null;
  bundleCents: number;
  priced: boolean;
  separately: number | null;
  canAdd: boolean;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2">
        {[hat, sack].map((p, i) => (
          <div key={i} className={`relative h-20 w-20 ${tile} ${p ? '' : 'border border-dashed border-text/25 bg-white'}`}>
            {p?.featuredImage?.url && (
              <Image src={p.featuredImage.url} alt="" fill sizes="80px" className="object-contain p-1 mix-blend-multiply" />
            )}
          </div>
        ))}
      </div>
      <dl className="mt-4 space-y-1.5 text-[0.875rem]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Hat</dt>
          <dd className="text-right font-medium text-text">{hat ? hat.title : 'Pick one'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Foot bag</dt>
          <dd className="text-right font-medium text-text">{sack ? sackName(sack) : 'Pick one'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Shipping</dt>
          <dd className="text-right font-medium text-text">Included</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-4">
        <span className="font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text">Total</span>
        <span className="text-[1.5rem] font-medium text-text">{priced ? formatUsd(bundleCents) : `From ${formatUsd(bundleCents)}`}</span>
      </div>
      {/* Bought apart, the hat pays standard shipping ($5.95 for one hat; the
          sack ships free), so compare like for like. Only shown when the
          bundle is actually cheaper (2026-10-09 audit: "$40 vs separately
          $39.98" read as the worse deal). */}
      {separately !== null && separately + 595 > bundleCents && (
        <p className="mt-1 text-right text-[0.75rem] text-muted">Separately {formatUsd(separately + 595)} with shipping</p>
      )}
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd}
        className="mt-4 w-full bg-text py-4 font-label text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black disabled:opacity-40"
      >
        {canAdd ? `Add to cart · ${formatUsd(bundleCents)}` : 'Pick a hat and a sack'}
      </button>
      <p className="mt-3 text-center text-[0.75rem] text-muted">Both ship together, in the hat box.</p>
    </>
  );
}
