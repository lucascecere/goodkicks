import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDiscount, discountProblem, normalizeCode, type Discount, type PricedLine } from './discounts.ts';
import { shippingCents } from './money.ts';

const base: Discount = {
  id: 'd', code: 'X', kind: 'percent', scope: 'all', value: 10, min_subtotal_cents: 0,
  starts_at: null, ends_at: null, usage_limit: null, used_count: 0, active: true,
};
const house = (key: string, cents: number, qty = 1): PricedLine => ({ key, house: true, unitPriceCents: cents, qty });
const local = (key: string, cents: number, qty = 1): PricedLine => ({ key, house: false, unitPriceCents: cents, qty });

test('percent only touches Townies hats', () => {
  const r = applyDiscount(base, [house('a', 2999), local('b', 3400)]);
  assert.equal(r.itemsCents, 299);
  assert.deepEqual(r.perLine, { a: 299 });
});

test('percent splits across lines and adds up exactly', () => {
  const r = applyDiscount({ ...base, value: 15 }, [house('a', 2999, 2), house('b', 2499)]);
  assert.equal(r.itemsCents, Math.floor(((2999 * 2 + 2499) * 15) / 100));
  assert.equal(Object.values(r.perLine).reduce((a, b) => a + b, 0), r.itemsCents);
});

test('fixed never exceeds the Townies hats', () => {
  assert.equal(applyDiscount({ ...base, kind: 'fixed', value: 1000 }, [house('a', 500)]).itemsCents, 500);
  assert.equal(applyDiscount({ ...base, kind: 'fixed', value: 700 }, [house('a', 2999)]).itemsCents, 700);
});

test('free shipping flag', () => {
  const r = applyDiscount({ ...base, kind: 'free_shipping' }, [house('a', 2999)]);
  assert.equal(r.freeShipping, true);
  assert.equal(r.itemsCents, 0);
});

test('problems: market-only bag, expired, used up, minimum', () => {
  assert.match(discountProblem(base, [local('a', 3000)])!, /Townies hats/);
  assert.match(discountProblem({ ...base, ends_at: '2020-01-01T00:00:00Z' }, [house('a', 3000)])!, /ended/);
  assert.match(discountProblem({ ...base, usage_limit: 1, used_count: 1 }, [house('a', 3000)])!, /used/);
  assert.match(discountProblem({ ...base, min_subtotal_cents: 5000 }, [house('a', 3000)])!, /\$50\.00/);
  assert.equal(discountProblem(base, [house('a', 3000)]), null);
});

test('codes are case and space insensitive', () => {
  assert.equal(normalizeCode(' tlelite 10 '), 'TLELITE10');
});

test('free shipping at $75 of hats', () => {
  assert.equal(shippingCents(2, 'ship', 7499), 895);
  assert.equal(shippingCents(3, 'ship', 7500), 0);
});

test('scoped codes only cover their kind', () => {
  const lines: PricedLine[] = [
    { key: 'hat', house: true, kind: 'hat', unitPriceCents: 2999, qty: 1 },
    { key: 'bag', house: true, kind: 'foot_bag', unitPriceCents: 999, qty: 1 },
  ];
  assert.deepEqual(applyDiscount({ ...base, scope: 'foot_bags' }, lines).perLine, { bag: 99 });
  assert.deepEqual(applyDiscount({ ...base, scope: 'hats' }, lines).perLine, { hat: 299 });
  assert.match(discountProblem({ ...base, scope: 'foot_bags' }, [lines[0]])!, /foot bags/);
});
