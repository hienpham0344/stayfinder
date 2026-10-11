import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBookingPrice } from './bookingPrice.ts';

test('keeps the checkout total as three base-rate nights plus both fees', () => {
  assert.deepEqual(calculateBookingPrice(850000, 3, 150000, 80000), {
    roomTotal: 2550000,
    fees: 230000,
    total: 2780000,
  });
});
