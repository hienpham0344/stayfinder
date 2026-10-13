# Booking quote foundation (local implementation, DB rollout pending)

B01 POST /api/booking-quotes accepts only source IDs, dates, occupancy and optional owned voucher claim/whole-block points. Spring supplies the owner. Pricing is classified USD integer cents: nightly × nights × room quantity plus one flat cleaning/service fee, zero demo tax, minus previewed room-only discount. Quote TTL is 10 minutes; it creates no stock or reward hold.

The persisted quote retains all selection/price/timezone/benefit fields. priceVersion is a positive JS-safe pricing fingerprint; booking acceptance must compare the complete captured pricing/capacity/timezone terms as well, so a hash collision cannot approve a changed amount. A new quote is required for expired or changed terms.

Room/accommodation snapshots have separate server UUIDs and captured source UUIDs. Live FK links may be cleared when sources are deleted; immutable source UUIDs and display/price/timezone payloads remain. No legacy numeric price is inferred as USD. Review eligibility now resolves accommodation_snapshot PK → source ID, and requires owned completed booking with verified paid_at.

Policy uses stay-local check-in 14:00 and checkout 11:00, as the approved specification states. Quotes validate stay-local today, paired dates and at most 90 nights; adults and children both consume room capacity.

Migration 005 is an unexecuted later G2 draft. It is NOT included in the frozen bootstrap +001–004 approval. PostgreSQL test fixtures verify exact stayfinder_test_20261013, isolate search_path from public and roll back all writes; no schema is reset or dropped.

Verification: 143 non-context/non-PostgreSQL backend tests pass (unit + Spring Security MVC). SnapshotIdentityIntegrationTest is tagged postgres and requires explicit G2/runtime properties. A guard-only invocation without approved target failed before connection as expected; no PostgreSQL fixture or migration has run. Use -DexcludedGroups= -Dgroups=postgres -Dtest=SnapshotIdentityIntegrationTest with local envFile and exact approved test-schema properties only after that gate. Real source SQL/locking/concurrency acceptance remains pending.

Next: replace legacy booking create/cancel/read contract with atomic quote consumption, immutable guest snapshots, benefit reservation, payment deadline, cancellation policy and transactional outbox.
