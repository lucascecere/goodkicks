'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart/cart-context';
import { cn } from '@/lib/utils';
import type { CollectionProduct } from '@/lib/shopify/collections';
import { isPreorder, PREORDER_SHIP_NOTE } from '@/lib/townies/preorder';
import { townKey } from '@/lib/townies/towns';
import { SACK_POOL, formatUsd, hatSackSavingCents, priceCents } from '@/lib/townies/hat-sack';

export type HatSackVariants = {
  shipsNowId: string | null;
  preorderId: string | null;
};

/**
 * Pick a town, we pick the bag.
 *
 * The hat is a real choice and gets the grid; the bag is a real surprise and gets
 * one tile. Showing five bag options next to the hats would read as a second
 * choice the customer doesn't actually have — the five are listed further down
 * the page instead, as disclosure rather than as a picker.
 *
 * Which Shopify variant the line lands on is decided HERE, by the chosen town's
 * `preorder` tag, because that variant is what puts the order in the right
 * delivery profile. See lib/townies/hat-sack.ts.
 */
export function HatSackPicker({
  hats,
  variants,
  bundleImageUrl,
  bundleCents,
  sackCents,
}: {
  hats: CollectionProduct[];
  variants: HatSackVariants;
  bundleImageUrl: string | null;
  /** Live from Shopify — never hardcode, the bundle is scheduled to reprice. */
  bundleCents: number;
  sackCents: number;
}) {
  const { addItem, openCart } = useCart();
  const [pickedHandle, setPickedHandle] = useState<string | null>(null);

  const picked = hats.find((h) => h.handle === pickedHandle) ?? null;
  const preorder = picked ? isPreorder(picked.tags) : false;
  const variantId = preorder ? variants.preorderId : variants.shipsNowId;
  const saving = hatSackSavingCents(picked ? priceCents(picked) : null, bundleCents, sackCents);

  // A pre-order town with no Pre-order variant would quote a ship-now delivery
  // date at checkout on a hat that's weeks out. Refuse the sale instead.
  const canAdd = Boolean(picked && variantId);

  function handleAdd() {
    if (!picked || !variantId) return;
    addItem({
      // Keyed by town, so two bundles for two different towns are two lines
      // rather than one line of quantity 2 with a single town on it.
      cartKey: `hat-sack:${picked.handle}`,
      variantId,
      variantName: picked.title,
      productTitle: 'Hat & Sack Bundle',
      priceInCents: bundleCents,
      imageUrl: picked.featuredImage?.url ?? bundleImageUrl ?? undefined,
      customAttributes: [
        { key: '_brand', value: 'townies' },
        // Visible (no leading underscore): these ride to the Shopify order and
        // are what actually gets picked and packed.
        { key: 'Hat', value: picked.title },
        { key: 'Foot bag', value: 'Random Good Kicks v1 — our pick' },
        ...(preorder
          ? [{ key: 'Fulfillment', value: `Pre-order — ${PREORDER_SHIP_NOTE}` }]
          : []),
      ],
    });
    openCart();
    setPickedHandle(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      {/* ── Step one: the town ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-block text-[0.625rem] tracking-[0.22em] text-town-stone">01</span>
          <h2 className="font-block font-bold uppercase text-lg tracking-[0.02em] text-town-navy">
            Pick your town
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {hats.map((hat) => {
            const { name } = townKey(hat);
            const isPicked = hat.handle === pickedHandle;
            const pre = isPreorder(hat.tags);
            return (
              <button
                key={hat.id}
                type="button"
                onClick={() => setPickedHandle(isPicked ? null : hat.handle)}
                aria-pressed={isPicked}
                className={cn(
                  'group text-left rounded-sm border bg-white transition-colors',
                  isPicked
                    ? 'border-town-forest ring-1 ring-town-forest'
                    : 'border-town-rule hover:border-town-navy',
                )}
              >
                <div className="relative aspect-square overflow-hidden rounded-t-sm bg-white">
                  {hat.featuredImage?.url ? (
                    <Image
                      src={hat.featuredImage.url}
                      alt={hat.featuredImage.altText ?? hat.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-town-rule" />
                  )}
                  {pre && (
                    <span className="absolute top-2 left-2 bg-town-navy text-town-cream text-[0.55rem] font-semibold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full">
                      Pre-order
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5 border-t border-town-rule">
                  <p className="font-block font-bold uppercase text-sm leading-none tracking-[0.02em] text-town-navy">
                    {name}
                  </p>
                  <p className="text-[0.7rem] text-town-muted mt-1 leading-snug line-clamp-1">
                    {hat.title.replace(name, '').replace(/^\s*/, '')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-[0.75rem] leading-relaxed text-town-muted">
          Not every town is in the bundle yet — more join as they come back in stock.
        </p>
      </div>

      {/* ── Step two: the bag, and the summary ───────────────────────────── */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-block text-[0.625rem] tracking-[0.22em] text-town-stone">02</span>
          <h2 className="font-block font-bold uppercase text-lg tracking-[0.02em] text-town-navy">
            We pick the bag
          </h2>
        </div>

        <div className="rounded-sm border border-town-rule bg-white p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'relative h-20 w-20 shrink-0 rounded-sm bg-white overflow-hidden',
                picked ? 'border border-town-rule' : 'border border-dashed border-town-stone/60',
              )}
            >
              {picked?.featuredImage?.url ? (
                <Image
                  src={picked.featuredImage.url}
                  alt={picked.title}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center px-1">
                  <span className="text-[0.55rem] uppercase tracking-[0.12em] text-town-stone text-center leading-tight">
                    Your town
                  </span>
                </div>
              )}
            </div>

            <span className="font-block text-xl text-town-stone" aria-hidden>
              +
            </span>

            {/* The bag slot never resolves to a specific bag on screen — that
                would promise the one we happened to render. */}
            <div className="relative h-20 w-20 shrink-0 rounded-sm border border-town-rule bg-town-navy grid place-items-center">
              <span className="font-block font-bold text-2xl text-town-cream" aria-hidden>
                ?
              </span>
              <span className="sr-only">One random Good Kicks foot bag</span>
            </div>
          </div>

          <dl className="mt-5 space-y-1.5 text-[0.8125rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-town-muted">Hat</dt>
              <dd className="text-right text-town-navy font-medium">
                {picked ? townKey(picked).name : <span className="text-town-stone">Pick one</span>}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-town-muted">Foot bag</dt>
              <dd className="text-right text-town-navy font-medium">Our pick</dd>
            </div>
          </dl>

          <div className="mt-5 pt-5 border-t border-town-rule">
            <div className="flex items-baseline justify-between">
              <span className="font-block font-bold uppercase text-sm tracking-[0.02em] text-town-navy">
                Total
              </span>
              <span className="text-2xl font-medium text-town-navy">
                {formatUsd(bundleCents)}
              </span>
            </div>
            {/* Only shown when there IS a saving. On the $24.99 zip hats the
                bundle is a penny more than the parts, and printing "save $0"
                there would be a claim we can't stand behind. */}
            {saving !== null && (
              <p className="mt-1 text-right text-[0.75rem] text-town-forest">
                Saves {formatUsd(saving)} against buying both
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="mt-5 w-full bg-town-forest text-white py-3.5 rounded-sm font-semibold uppercase tracking-[0.1em] text-sm transition-colors hover:bg-town-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-town-forest focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {picked
              ? `${preorder ? 'Pre-order' : 'Add to bag'} — ${formatUsd(bundleCents)}`
              : 'Pick a town first'}
          </button>

          {picked && preorder && (
            <p className="mt-3 text-center text-[0.7rem] uppercase tracking-[0.14em] text-town-muted">
              Pre-order · {PREORDER_SHIP_NOTE}
            </p>
          )}
          {picked && !variantId && (
            <p className="mt-3 text-center text-[0.75rem] text-town-muted">
              This town isn&apos;t available in the bundle right now.
            </p>
          )}
        </div>

        {/* Disclosure, not a picker: the five bags in the draw. */}
        <div className="mt-6 rounded-sm border border-town-rule bg-town-cream/60 p-5">
          <p className="font-block font-bold uppercase text-[0.7rem] tracking-[0.16em] text-town-navy mb-3">
            One of these five
          </p>
          <ul className="grid grid-cols-5 gap-2">
            {SACK_POOL.map((bag) => (
              <li key={bag.name} className="text-center">
                <div className="relative aspect-square">
                  <Image
                    src={bag.image}
                    alt={`Good Kicks ${bag.name} foot bag`}
                    fill
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <p className="mt-1 text-[0.5rem] uppercase tracking-[0.01em] text-town-muted leading-tight">
                  {bag.name}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-town-muted">
            Hand-stitched, properly weighted, {formatUsd(sackCents)} on their own. You
            don&apos;t choose which one — that&apos;s the deal.
          </p>
        </div>
      </div>
    </div>
  );
}
