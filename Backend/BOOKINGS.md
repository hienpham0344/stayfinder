# Booking implementation (local tests; DB rollout pending)

B01 POST /api/booking-quotes accepts source IDs, dates, occupancy and optional owned voucher claim/whole-block points. The authenticated principal supplies the owner. Server USD integer-cent pricing is nightly × nights × quantity plus one flat cleaning/service fee, zero demo tax, minus room-only discount. Quote TTL is 10 minutes; it creates no inventory or benefit hold.

B02 POST /api/bookings now accepts only quoteId, guest and paymentMethod with Idempotency-Key. Old date/price/status/owner payloads are rejected. Guest name is trimmed 1–100 characters, email <=254, phone 9–15 digits with optional +, special request <=2000. Quotes are consumed once; matching request/key replays the stored response, changed content conflicts. GET/list are owner-scoped, support status filtering and public pagination, and use captured display data.

Creation rechecks expiry, full captured pricing/capacity/timezone terms and daily stock under locks. priceVersion is only a JS-safe display fingerprint; complete term comparison prevents relying on hash uniqueness. Lock order is request advisory mutex → affected owner user/wallet → source room → accommodation for create → quote/booking → payment/claim/refund. Already-managed state is refreshed under pessimistic locks after waiting. Real PostgreSQL concurrency/rollback behavior remains unverified.

Snapshot PKs are independent server UUIDs with immutable source IDs and copied display/USD/timezone payloads. Legacy live FK links remain and may be cleared after source deletion. No legacy numeric price is inferred as USD. Reviews resolve captured source accommodation and require owned completed booking with verified paid_at.

Bank booking starts pending/unpaid with createdAt +15-minute deadline. Pay-at-property starts confirmed/unpaid and holds selected benefits until settlement or cancellation. Creating a booking never marks it paid.

Cancellation preview/mutation use stay-local 14:00 check-in; USER cancellation at/after that time is denied. Unpaid cancellation/expired bank hold releases benefits once. Paid cancellation stores a requested refund linked to exactly one matching successful USD collection; it preserves original success and consumed benefits. Confirmation/restoration belongs to the flagged ADMIN controls in Task5. pointRestoration is the eligible numeric point amount; voucherRestoration describes the restoration trigger, with final usability checked at execution, including expiry. Scheduled expiry rechecks state under locks; tests disable scheduling with stayfinder.workers.enabled=false. Approved checkout is 11:00.

Source transactions publish fixed-type owner/source/time outbox rows. Claim and earning callers now publish as well. No guest/private payload is emitted. Inbox materialization remains a later task.

Migrations 005/006 are unexecuted later G2 drafts and NOT in frozen bootstrap +001–004 approval. Task4 must extend payment/receipt mappings and preserve locked VND/rate on bank refund requests before rollout. The legacy custom payment webhook has not yet been replaced; no deployment/payment completion is claimed.

Verification: 164 non-context/non-PostgreSQL backend tests pass, including Spring Security MVC, price/source/owned quote, persisted idempotent JSON replay, guest boundaries, cancellation/expiry/refund request, refresh-after-lock and outbox behavior. SnapshotIdentityIntegrationTest is postgres-tagged, checks the exact approved test schema and rolls fixture writes back; a guard-only run rejected missing approval before connecting. No migration, fixture write or live provider action has run. Real SQL/concurrency/orphan rollback/full application-context verification remains G2-gated.
