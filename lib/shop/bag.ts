'use client';

import { useSyncExternalStore } from 'react';

// The market bag. Separate from the Shopify cart on purpose: market hats pay
// through our own Stripe checkout, so the two can't share one basket until the
// town hats move over too.
//
// Kept in localStorage (it's only a list of product ids and a snapshot for
// display); prices are always re-read from the database at checkout.

export type BagLine = {
  productId: string;
  qty: number;
  title: string;
  sellerName: string;
  sellerSlug: string;
  sellerId: string;
  pickup: boolean;
  /** A Townies hat (codes apply) rather than a local shop's. */
  house?: boolean;
  priceCents: number;
  image: string | null;
};

const KEY = 'townies_market_bag_v1';
const EVENT = 'townies-market-bag';
const EMPTY: BagLine[] = [];

let cache: BagLine[] | null = null;

function read(): BagLine[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as BagLine[]).filter((l) => l && l.productId && l.qty > 0) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: BagLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode: the bag still works for this page view */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBag(): BagLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function addToBag(line: Omit<BagLine, 'qty'>, qty = 1) {
  const lines = [...read()];
  const hit = lines.find((l) => l.productId === line.productId);
  if (hit) hit.qty = Math.min(20, hit.qty + qty);
  else lines.push({ ...line, qty });
  write(lines.map((l) => ({ ...l })));
}

export function setQty(productId: string, qty: number) {
  write(read().map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l)));
}

export function removeFromBag(productId: string) {
  write(read().filter((l) => l.productId !== productId));
}

export function clearBag() {
  write([]);
}

export function bagCount(lines: BagLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}
