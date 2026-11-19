# Backend verification and operation

## Local prerequisites

Java 21, Maven Wrapper (`bash ./mvnw`), PostgreSQL 16+, Python 3 for the optional benchmark. Application runtime dependencies added by this work are only Spring Cache and Caffeine. Do not upgrade the existing Spring Boot parent to run these instructions.

Normal startup still reads `.env` and validates the schema. Tests instead set `spring.config.location=classpath:application-test.yaml` in Surefire, so they do not import `.env` or production datasource configuration. The default `mvnw test` runs unit/HTTP tests and skips explicitly gated PostgreSQL integration classes.

```bash
cd Backend
bash ./mvnw test
```

For integration tests, create a **disposable local database named `stayfinder_test`** owned by `stayfinder_test`. Set `PGHOST=127.0.0.1`, `PGPORT` (default 55439), `PGUSER`, and `PGPASSWORD` as needed. Credentials are environment variables, never command arguments or tracked files.

```bash
bash scripts/test-database.sh
```

The script accepts local hosts only and applies `000`–`003` only when the schema is empty. It then runs `verify -Dstayfinder.integration=true`. Integration fixtures check `current_database()` before truncating their explicit table set. Never give this database name to a database containing valuable data. The GitHub workflow checks the generated API contract and provisions a fresh PostgreSQL service on each job; hosted run [44531199680](https://github.com/hienpham0344/stayfinder/actions/runs/44531199680) succeeded on commit5005412 with138 Maven tests and6 migration tests. `docs/evidence/ci-hosted.json` records the exact commit and artifact counts.

## Schema migration

- **Fresh database:** apply `000_baseline.sql`, `001_public_local_auth_integrity.sql`, `002_backend_capabilities.sql`, then `003_operations_pagination.sql` in that order, with `ON_ERROR_STOP=1`.
- **Existing database:** never run `000`. Back up and inspect schema/duplicates first; review `001` (including its removal of the Supabase Auth FK), then apply missing migrations explicitly. No migration runs at application startup.
- `002` preserves existing reward balances using opening ledger entries. It refuses negative balances and pending bookings with unknown creation time. Existing pending bookings receive `created_at + 15 minutes`; existing room capacity defaults conservatively to one and must be reviewed by the owner.
- Test-only roles/accounts are fixtures, not seed data for real deployments. The initial administrator must be provisioned by a database operator for an explicitly identified registered account. There is no public admin creation endpoint.
- Back up before changing a real database. Once new ledger/voucher/audit data exists, restoration requires the reviewed backup or a forward migration; dropping new tables/columns would lose history. No destructive down migration is shipped.

Run `python3 scripts/test-migrations.py` separately for legacy balance preservation, replay, pending backfill, and transactional failure cases. It creates/resets only the local `stayfinder_migration_test` database with its own opt-in marker, refuses an existing unmarked database, and needs permission to create a disposable database. The CI workflow runs both suites.

## Authentication and roles

Registration always creates `CUSTOMER`. Personal APIs accept enabled authenticated accounts. `/api/partner/**` requires `PARTNER`; `/api/admin/**` requires `ADMIN`. `/api/partner-applications` POST is CUSTOMER-only. Role is read from the database on each authenticated request. A disabled account or mismatched `auth_version` cannot use an old token. Logout revokes all account sessions, as does password change; role changes and locking also revoke tokens. Legacy JWTs without a version work only while the stored version is zero and expire normally.

Updating a profile accepts only `fullName`, `phone`, and `avatarUrl`. Changing a password requires the current password. Unknown/disabled accounts still perform a dummy BCrypt match for normal-size login passwords. Authentication rate limits are per instance, with bounded Caffeine storage, remote socket address only, and no trust in forwarded proxy headers.

Default limiter properties: `stayfinder.security.login-attempts=10`, `registration-attempts=10`, `rate-limit-window=PT15M`, `rate-limit-capacity=10000`. Login is limited by normalized account fingerprint and by IP (five times the account limit). Multi-instance deployment requires a reviewed shared limiter and trusted proxy configuration.

## Booking/payment/rewards rules

- One `room` row is one physical room. A booking has quantity one, a positive guest count no greater than capacity, whole VND prices computed by the server, and immutable commercial snapshots. Booking dates and availability share the Vietnam calendar and a maximum 365-night interval.
- `stayfinder.booking.hold-minutes=15`. Availability ignores expired holds without waiting for the scheduler. Expiry sets `CANCELLED`/`EXPIRED`; user cancellation is only for unpaid bookings. A cancelled request is idempotent.
- Scheduler default delay: 60000 ms; disable with `stayfinder.scheduling.enabled=false`. Paid confirmed stays complete after checkout (`12:00`, `Asia/Ho_Chi_Minh`, configurable), with per-booking transactions and idempotent points. No automatic completion for unmatched payment totals.
- Only a valid signed SePay webhook confirms payment. Signature input is timestamp + `.` + exact raw body; timestamp window is 300 seconds. Provider transaction IDs are unique. Signed rejected transfers are retained in `payment_anomalies`; admin reads them without changing payment history.
- Webhook processing releases its transaction before recording a rejected transfer, avoiding nested-transaction connection exhaustion. Confirmation and payment creation serialize on the physical room before the booking. New bookings lock accommodation before room, matching partner edits, so a waiting booking cannot use a room changed by a newly PENDING property. Voucher consumption checks the expected voucher and expiry after waiting for its lock.
- Rewards default: one point per 1000 VND actually paid, earned after completion. Catalog seed: 1000 points buys a 10000 VND discount, minimum spend 100000 VND, expiry 30 days. Existing balances are preserved, not reset or re-granted. Replaying migration 002 never creates an opening entry for an account with ledger history; a ledger/balance mismatch aborts the migration for explicit reconciliation.
- Redemptions require a client-generated UUID `idempotencyKey`; retries reuse it. Insufficient points fail atomically. A voucher is reserved during booking, consumed on payment, released on cancellation/expiry, and can be used once. If valid when reserved it remains held through that booking's payment window. Expired unused vouchers do not refund points.
- Reviews require the owner's completed booking. Public queries exclude hidden reviews and unpublished properties. Administrative moderation keeps an audit trail.

## Search, recommendations, cache

Search/filter/pagination execute on the server. Search returns the cheapest **matching** room and its price, not a cheaper room that fails capacity/date/price filters. `matchedRoomId`/`matchedPrice` identify that room. Pagination uses stable ID tie-breakers and bounded page sizes. Legacy list endpoints are retained for compatibility; prefer paginated endpoints for growing datasets.

Recommendations rank at most 200 eligible current properties, based on the current account's wishlist/completed stays: matching type, shared amenities, similar price, then review rating/count and stable ID. New users receive the same bounded fallback. No AI/external service is called; this bounded heuristic is not a claim of ML recommendation quality.

Cache is for one application instance:

- Detail DTOs: TTL 60 seconds, maximum 2000 entries. Keys include property ID/version; each public detail request first checks current ACTIVE state in PostgreSQL. Changed events evict after commit. Public eligibility/version and cache-miss metadata share a REPEATABLE_READ snapshot to avoid publishing unapproved concurrent metadata.
- Type/feature/room-type metadata: TTL 10 minutes, maximum 100 cache entries; metadata is read-only through these APIs.
- `stayfinder.cache.enabled=false` disables it. Detail limits are configurable with `detail-ttl-seconds` and `detail-max-size`.
- No caching of availability, authorization, rewards balances, booking or payment state. Multiple replicas require a separate cache consistency decision before scaling.

## Evidence and benchmark reproduction

Create a second **empty disposable database `stayfinder_benchmark_test`**, apply `000`–`003`, then `db/fixtures/benchmark.sql`. Fixture checks the database name and refuses nonempty users. It creates 1000 properties, 10000 rooms, 100000 bookings/payments/ledger rows, and 10000 reviews.

Run the app on localhost with a separate config (`spring.config.location`), this benchmark database, scheduler off, and the public fixture JWT key from `application-test.yaml`. Never use that key for a real environment. `scripts/benchmark.py` only addresses `127.0.0.1`; its fixed tokens are synthetic fixture identities. Do not point a real deployment at this database name/key.

```bash
python3 scripts/benchmark.py --port 58091 --clients 20 --warmup 30 --seconds 300 --rounds 3 --output /tmp/performance.json
```

Wait for `/actuator/health` to report UP before starting; warmup errors invalidate that round. The workload measures catalog/detail/availability/booking reads and idempotent favorite writes. It does **not** establish a latency SLA for every write endpoint, payment network calls, WAN/mobile networks, or every admin aggregate. Report each workload separately. Concurrent benchmark and desktop processes can affect timings; compare under the same hardware/load.

`db/fixtures/explain.sql` records actual SELECT plans using `EXPLAIN (ANALYZE,BUFFERS)`. Evidence includes before/after the operation pagination index, and separate cache-on/off measurements. Budget tests count ORM SQL for booking pages/availability and verify public detail miss/hit behavior. SQL timing is not the same as total HTTP latency.

Run the paired cache comparison from `Backend/` after packaging:

```bash
bash scripts/benchmark-suite.sh
```

It uses `src/test/resources/application-benchmark.yaml`, saves completed rounds under `docs/evidence/`, and saves server logs under ignored `target/benchmark-logs/`. The six workloads are catalog, hot detail, varied detail, availability, personal booking page, and idempotent wishlist PUT. Each cache mode performs three 30-second warmups and three 300-second measured rounds with 20 clients.

The provider signature implementation follows the [official SePay HMAC authentication guide](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc): timestamp plus exact raw body, HMAC-SHA256, constant-time comparison and a five-minute window. Configure a JSON HMAC webhook in SePay Test mode. Successful receipt returns HTTP 200 and `{"success": true}`; older per-account webhook configurations may require 201 according to [SePay's integration guide](https://docs.sepay.vn/tich-hop-webhooks.html), so verify the chosen sandbox configuration. Local signed fixtures do not prove external delivery from SePay.

After both cache modes finish, run `python3 scripts/summarize-benchmark.py`. It refuses incomplete rounds, retains per-round percentiles, checks the scoped latency/error budgets, and writes `docs/evidence/benchmark-summary.json`.

Regenerate the checked-in OpenAPI YAML (JSON-compatible YAML) with `python3 scripts/generate-openapi.py`. An integration test compares every application route against the document. Review business descriptions when behavior changes; the generator does not replace contract review.


## ADMIN/PARTNER and booking/payment load

Run `python3 scripts/benchmark-operations.py --port 58091 --clients 20 --warmup 30 --seconds 300 --rounds 3 --output docs/evidence/performance-operations.json` against the same synthetic fixture. It verifies the fixture before writes, then reads admin/partner statistics, booking/payment pages and creates a booking, creates its pending payment and cancels the unpaid booking. It retains this synthetic history and records count deltas, errors, per-workload percentiles and sampled pool metrics. A nonzero exit means errors or a scoped p95 budget failure; a short smoke run is not full acceptance. Do not run against real data.

## Verified SePay sandbox delivery

The sanitized result is `docs/evidence/sepay-sandbox-e2e.json`. Test mode was exercised through official SePay CLI 0.1.9 using a synthetic ACB account, a JSON HMAC listen-only webhook and a separate backend on loopback58092. No live transfer or public server was used. The CLI session was revoked/logged out afterward.

To repeat with your own sandbox session: approve the official device login yourself, keep CLI credentials in an ignored private directory, create a synthetic bank account and a listen-only HMAC webhook. Generate a private random shared secret; pass it through stdin to CLI `--secret -` and to the backend environment, never through argv or Git. Configure paycode prefix `SF`, suffix length26, type `NumberAndLetter`, active/detection enabled. Use `sandbox simulate payment_in --override content=<full payment code>`: CLI `--code` has a ten-character limit and must not truncate the application's 28-character payment code. Relay with `webhook listen --forward http://127.0.0.1:58092/api/payments/webhook/sepay --forward-retries 0`; omit payload/header printing.

Create bookings via authenticated fixture APIs, simulate the exact payment amount and assert SUCCESS/CONFIRMED; replay the same provider transaction and assert no extra effect. Test mismatched amount, cancelled booking and expired hold: each must remain unpaid, produce a reconciliation anomaly and reject confirmation. Expiry can be controlled on a specifically identified synthetic booking in the disposable database. Stop only your isolated processes, revoke/logout the CLI session and publish only sanitized statuses/counts, never raw bank/credential/header dumps. See [paycode configuration](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/cau-hinh) and [HMAC authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).
