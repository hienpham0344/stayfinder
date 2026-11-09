import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

assert.ok(existsSync(new URL('./frontendState.ts', import.meta.url)), 'shared booking model must exist');
const { createDraft, quoteBooking, toggleSaved, confirmBooking, cancelBooking, reviewBooking, validTravelDates, roomCanHost, formatDateRange, filterCatalog } = await import('./frontendState.ts');
const stay = {
  id: 'villa', title: 'Villa', type: 'Villas', pricePerNight: 299, cleaningFee: 60, serviceFee: 75,
  maxGuests: 4, rating: 4.9, location: { city: 'Bali', province: 'Indonesia' },
  amenities: [{ id: 'wifi', name: 'Wi-Fi' }],
  roomTiers: [
    { id: 'deluxe', pricePerNight: 299, maxGuests: 3, availableCount: 3 },
    { id: 'suite', pricePerNight: 450, maxGuests: 4, availableCount: 2 },
  ],
};
const draft = { ...createDraft(new Date(2026, 10, 5)), stayId: 'villa', tierId: 'suite', checkIn: '2026-11-12', checkOut: '2026-11-15' };
assert.equal(draft.checkIn, '2026-11-12');
assert.equal(createDraft(new Date(2026, 11, 31)).checkIn, '2027-01-01');
assert.equal(quoteBooking(stay, draft, 24500).total, 1485, 'Suite uses its own price');
assert.equal(quoteBooking(stay, { ...draft, rewardApplied: true }, 24500).total, 1460, 'reward reduces the total');
assert.equal(quoteBooking(stay, { ...draft, rooms: 2 }, 24500).roomTotal, 2700, 'room count affects price');
assert.equal(quoteBooking(stay, { ...draft, rewardApplied: true }, 100).discount, 0, 'insufficient points cannot be spent');
assert.throws(() => quoteBooking(stay, { ...draft, tierId: 'missing' }, 24500), /room/i);
assert.throws(() => quoteBooking(stay, { ...draft, checkOut: draft.checkIn }, 24500), /date/i);
assert.equal(validTravelDates('2026-11-04', '2026-11-07', new Date(2026, 10, 5)), false);
assert.equal(validTravelDates('2026-02-30', '2026-03-04', new Date(2026, 0, 1)), false);
assert.equal(validTravelDates('2026-11-12', '2026-11-15', new Date(2026, 10, 5)), true);
assert.equal(roomCanHost(stay.roomTiers[0], { ...draft, adults: 4, rooms: 1 }), false);
assert.equal(roomCanHost(stay.roomTiers[0], { ...draft, adults: 4, rooms: 2 }), true);
assert.equal(roomCanHost(stay.roomTiers[0], { ...draft, adults: 1.5 }), false, 'party counts must be integers');
assert.equal(roomCanHost(stay.roomTiers[0], { ...draft, children: -1 }), false);
assert.equal(roomCanHost(stay.roomTiers[0], { ...draft, rooms: 0 }), false);
assert.deepEqual(toggleSaved(['villa'], 'villa'), []);
assert.deepEqual(toggleSaved([], 'villa'), ['villa']);
const quote = quoteBooking(stay, draft, 24500);
const booking = { ...draft, id: 'SF-TEST', quote, status: 'upcoming', paymentMethod: 'CreditCard' };
assert.equal(confirmBooking([booking], booking).length, 1, 'confirmation is idempotent');
assert.equal(confirmBooking([], booking)[0].tierId, 'suite');
assert.equal(cancelBooking([booking], booking.id)[0].status, 'cancelled');
assert.equal(reviewBooking([booking], booking.id, 5, 'Great')[0].review, undefined, 'upcoming stay cannot be reviewed');
const reviewed = reviewBooking([{ ...booking, status: 'completed' }], booking.id, 4, ' Nice stay ');
assert.deepEqual(reviewed[0].review, { rating: 4, comment: 'Nice stay' });
assert.match(formatDateRange('2026-11-30', '2026-12-02'), /Nov.*Dec/);
assert.match(formatDateRange('2026-12-30', '2027-01-02'), /2026.*2027/);
const filters = { destination: 'Bali, Indonesia', adults: 2, children: 0, rooms: 1, minPrice: 0, maxPrice: 500, rating: 0, types: [], amenities: [], sortBy: 'recommended' };
assert.equal(filterCatalog([stay], filters).length, 1);
assert.equal(filterCatalog([stay], { ...filters, types: ['Hotel'] }).length, 0);
assert.equal(filterCatalog([stay], { ...filters, rooms: 9 }).length, 0);
assert.equal(filterCatalog([stay], { ...filters, adults: 4, maxPrice: 350 }).length, 0, 'budget must cover a room that actually fits the party');
assert.equal(filterCatalog([stay], { ...filters, adults: 4 })[0].pricePerNight, 450, 'search displays the available suite rate');
assert.equal(filterCatalog([stay], { ...filters, minPrice: 400 })[0]?.pricePerNight, 450, 'a higher room tier can match the price range');
assert.equal(filterCatalog([stay], { ...filters, minPrice: 400 })[0]?.matchedTierId, 'suite', 'opening a filtered result must retain the room that matches its displayed price');
const poolStay = { ...stay, amenities: [{ id: 'pool', name: 'Hồ bơi vô cực' }] };
assert.equal(filterCatalog([poolStay], { ...filters, amenities: ['Pool'] }).length, 1, 'amenity filtering uses catalog IDs across languages');
const { availableRoom } = await import('./frontendState.ts');
assert.equal(availableRoom(stay, { ...draft, adults: 4 })?.id, 'suite', 'choose a room that fits instead of the first room');
assert.equal(availableRoom(stay, { ...draft, adults: 2 }, 'suite')?.id, 'suite', 'retain a valid explicit room selection');
assert.equal(availableRoom(stay, { ...draft, adults: 2 }, 'missing')?.id, 'deluxe', 'recover a stale tier selection');
console.log('Frontend model regression assertions passed.');
