# Booking / partner approval race regression

Test: `BackendIntegrationTest#bookingWaitingOnPartnerEditCannotUseUnapprovedRoom`.

A writer holds the accommodation and room locks, changes the room price, and marks the property PENDING. Before the writer commits, the customer starts booking. The test waits until PostgreSQL reports that booking is blocked on the writer, then commits the edit.

Observed before fix: `Tests run: 1, Failures: 1, Errors: 0`; expected HTTP `404` but got `200`.

Fix: lock and validate the accommodation before locking the physical room, matching the partner write lock order. An edit that commits first is checked as PENDING; a booking that locks first snapshots the approved data before the edit.

Observed after fix: full Maven verify, 137 tests, 0 failures/errors/skips, including this regression. See tests.json.
