// Run: node --test lib/shop/money.test.mts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitLine, shippingCents, minPriceCents, releaseAt, WHOLESALE_CENTS } from './money.ts';

test('everyday hat, plain business', () => {
  assert.deepEqual(splitLine({ unitPriceCents: 3000, wholesaleCents: WHOLESALE_CENTS.everyday, qty: 1 }), {
    sellerPayoutCents: 800,
    royalbacksFeeCents: 0,
    ourCutCents: 2200,
  });
});

test('lifestyle hat, RoyalBacks-sourced, qty 3', () => {
  const s = splitLine({ unitPriceCents: 3500, wholesaleCents: WHOLESALE_CENTS.lifestyle, qty: 3, royalbacksSourced: true });
  assert.deepEqual(s, { sellerPayoutCents: 3300, royalbacksFeeCents: 1500, ourCutCents: 5700 });
  assert.equal(s.sellerPayoutCents + s.royalbacksFeeCents + s.ourCutCents, 3500 * 3);
});

test('house seller keeps everything', () => {
  assert.deepEqual(splitLine({ unitPriceCents: 2999, wholesaleCents: 2400, qty: 2, house: true }), {
    sellerPayoutCents: 0,
    royalbacksFeeCents: 0,
    ourCutCents: 5998,
  });
});

test('price below wholesale + $1 is refused', () => {
  assert.equal(minPriceCents(2200), 2300);
  assert.throws(() => splitLine({ unitPriceCents: 2299, wholesaleCents: 2200, qty: 1 }));
  assert.doesNotThrow(() => splitLine({ unitPriceCents: 2300, wholesaleCents: 2200, qty: 1 }));
});

test('bad qty is refused', () => {
  assert.throws(() => splitLine({ unitPriceCents: 3000, wholesaleCents: 2200, qty: 0 }));
  assert.throws(() => splitLine({ unitPriceCents: 3000, wholesaleCents: 2200, qty: 1.5 }));
});

test('shipping tiers match the Townies Shopify profile', () => {
  assert.equal(shippingCents(1, 'ship'), 595);
  assert.equal(shippingCents(2, 'ship'), 895);
  assert.equal(shippingCents(3, 'ship'), 1295);
  assert.equal(shippingCents(9, 'ship'), 1295);
  assert.equal(shippingCents(4, 'pickup'), 0);
});

test('payout releases 14 days after hand-over', () => {
  const d = new Date('2026-10-01T12:00:00Z');
  assert.equal(releaseAt(d).toISOString(), '2026-10-15T12:00:00.000Z');
});

import { storeShippingCents } from './money.ts';

test('store shipping mirrors the Shopify profiles', () => {
  assert.equal(storeShippingCents({ standardHats: 1, preorderHats: 0, merchandiseCents: 2999 }), 595);
  assert.equal(storeShippingCents({ standardHats: 2, preorderHats: 0, merchandiseCents: 5998 }), 895);
  assert.equal(storeShippingCents({ standardHats: 0, preorderHats: 2, merchandiseCents: 4998 }), 500);
  assert.equal(storeShippingCents({ standardHats: 1, preorderHats: 1, merchandiseCents: 5498 }), 1095);
  assert.equal(storeShippingCents({ standardHats: 0, preorderHats: 0, merchandiseCents: 999 }), 0); // foot bags / bundles only
  assert.equal(storeShippingCents({ standardHats: 3, preorderHats: 0, merchandiseCents: 8997 }), 0); // over $75
});
