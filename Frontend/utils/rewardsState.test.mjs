import assert from 'node:assert/strict';
const { spendRewardPoints } = await import('./frontendState.ts');

const account = { points: 24500, spends: [] };
const breakfast = { id: 'claim-breakfast-1', title: 'Redeemed Free Breakfast', points: 5000 };
const claimed = spendRewardPoints(account, breakfast);
assert.deepEqual(claimed, { points: 19500, spends: [breakfast] }, 'the debit and history entry are one state transition');
assert.equal(spendRewardPoints(claimed, breakfast), claimed, 'retrying the same claim cannot debit twice');
assert.equal(spendRewardPoints({ points: 100, spends: [] }, breakfast).points, 100, 'insufficient points must not create debt');
assert.deepEqual(spendRewardPoints({ points: 100, spends: [] }, breakfast).spends, [], 'a rejected claim cannot create history');
for (const points of [-1, 0, 1.5, NaN, Infinity]) assert.equal(spendRewardPoints(account, { ...breakfast, points }), account, 'invalid costs must not credit or debit points');
const booking = { id: 'booking-SF-TEST', title: 'Booking at Villa Azure Retreat', points: 2500 };
assert.deepEqual(spendRewardPoints(claimed, booking), { points: 17000, spends: [booking, breakfast] }, 'booking redemption shares the same persistent session ledger');
