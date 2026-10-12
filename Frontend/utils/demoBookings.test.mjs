import assert from 'node:assert/strict';
import test from 'node:test';
import { cancelDemoBooking, reviewDemoBooking } from './demoBookings.ts';

const bookings = { upcoming: { status: 'upcoming' }, completed: { status: 'completed' } };

test('cancellation only moves an upcoming booking', () => {
  const cancelled = cancelDemoBooking(bookings, 'upcoming');
  assert.equal(cancelled.upcoming.status, 'cancelled');
  assert.equal(cancelled.completed.status, 'completed');
  assert.equal(bookings.upcoming.status, 'upcoming');
  assert.deepEqual(cancelDemoBooking(bookings, 'completed'), bookings);
});

test('review only marks a completed booking', () => {
  const reviewed = reviewDemoBooking(bookings, 'completed');
  assert.equal(reviewed.completed.reviewed, true);
  assert.equal(reviewed.upcoming.reviewed, undefined);
  assert.deepEqual(reviewDemoBooking(bookings, 'upcoming'), bookings);
});
