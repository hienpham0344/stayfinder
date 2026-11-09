# User payment simulation

Implements the backend sandbox outcomes for ACT-06 / SEQ-06. This performs no bank transfer and calls no SePay endpoint. Set `stayfinder.payment-simulation.enabled=true` only in an isolated demo/test deployment; the default is false. Apply reviewed migration `012_payment_simulation.sql` before enabling. It has not been applied by this change.

## Contract

1. CUSTOMER creates a booking using the existing `pay_at_property` method. This reserves a confirmed, unpaid booking.
2. Create its payment ledger using `POST /api/bookings/{id}/payments` with `{"method":"pay_at_property"}` and an Idempotency-Key.
3. Call `POST /api/bookings/{id}/payment-simulations`, with an Idempotency-Key and `{"outcome":"SUCCESS"}`, `FAILURE`, or `CANCEL`.
4. Read current booking/payment state using their existing GET APIs. Read attempt snapshots from `GET /api/bookings/{id}/payment-simulations?page=0&size=20`.

Only the authenticated CUSTOMER who owns the booking can call these operations. PARTNER and ADMIN do not inherit this endpoint. A failed/cancelled simulation records an immutable attempt and leaves both the confirmed booking and pending payment unchanged. Retry uses a new key. SUCCESS records collection once, consumes reserved benefits and publishes the existing booking-paid event in the same transaction. Every response marks `isDemo=true`.

The same key and body replay the original attempt snapshot; changing the body under that key is an idempotency conflict. A different key after settlement is rejected with BOOKING_INVALID_STATE, so it cannot consume benefits again or overwrite a paid state with failure. A cancelled/expired/completed booking, bank-transfer payment, missing ledger, wrong owner, or inconsistent monetary snapshot cannot be simulated. Cancelling checkout does not cancel a booking.

The aggregate payment remains `pending` after FAILURE because it represents the amount still owed, while the separate attempt records FAILURE. This is not a new online payment method: it deliberately reuses the existing pay-at-property lifecycle. The FE must label the action as a demo and integrate these endpoints separately from bank transfer. Returning a simulation success is never proof of real collection.

## Verification

`PaymentSimulationServiceTest` covers default-off behavior, owner-scoped locking, failure/cancellation followed by success, attempts after settlement, booking-state and bank-transfer rejection, and history ownership. `PaymentSimulationHttpTest` covers role and validation boundaries. Run these with the Maven wrapper and then the full default verify suite.

PostgreSQL verification remains required: apply migration in a disposable approved schema, send concurrent success calls using the same key and then distinct keys, and assert one collection, one successful attempt, one benefits consumption and one booking-paid outbox event. Also test failure then success, cancellation without booking cancellation, and another user's booking returning 404. No live Supabase or database test is claimed by the offline suite.
