# SePay Test Mode payment implementation (in progress)

P01–P05 use the supported bank_transfer/pay_at_property contract. Payment creation is owned and idempotent; it accepts only method and must match the immutable booking. Original amount is classified integer USD cents. Existing instructions retain their VND amount/rate/version/account/reference/QR after configuration changes. Property ledger payments stay pending with no VND conversion; creation never sets paid.

SePay is behind PaymentProvider. Bank instructions are disabled unless explicit Test Mode, an adequate dedicated webhook secret and valid Test Mode bank/account configuration are present. No Live fallback or client environment flag is accepted. Virtual account display and underlying receiving account are captured separately. Public method availability reveals no credentials/account details.

Native POST /api/payments/webhook/sepay reads at most65537 bytes and authenticates the exact original body using X-SePay-Signature and X-SePay-Timestamp. HMAC SHA256 signs timestamp dot raw bytes, with a ±300-second window and constant-time comparison. Signature and secret never enter receipt storage. Strict native parsing rejects duplicate fields/trailing JSON/fractional or coerced amounts and parses transactionDate in UTC+7. [Authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).

A receipt transaction persists parsed verified fields and SHA256 body hash before native HTTP200 JSON success=true acknowledgement. Unique provider/test/eventId plus a receipt advisory mutex preserves the first body. Changed payload on the same native ID increments conflict metadata without replacing the original. Database/commit failure cannot return a successful acknowledgement. Receipt registration never acquires financial locks. [Payload and acknowledgement](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).

The worker acquires owner wallet → room → booking → payment → receipt and refreshes rows after waits. Exact incoming account/VA/gateway/reference/VND and valid provider time are required. Native dates have second precision; compare creation/receipt boundaries at that precision. Unknown/outgoing transactions are retained as ignored/reconciliation; mismatched amount/account/time, second collection or altered same-ID payload cannot falsely confirm and are retained for reconciliation. Conflicts received after processing are picked up again and mark the related payment required without erasing its original collection.

Confirmation requires processing before the15-minute hold deadline as well as an on-time transaction. Inventory excludes expired holds regardless of worker backlog, so a receipt processed later cannot revive that reservation. Exact late/cancelled collection remains successful collection history and creates a requested refund with the original locked VND/rate; released benefits are not consumed again. Refund confirmation/restoration and property collection are Task5 ADMIN demo controls, not real bank actions.

Rate defaults to labelled25000 VND/USD. Lock HALF_UP(cents × rate /100). Simulator supports1000–499000000 VND; unsupported totals return PAYMENT_AMOUNT_UNSUPPORTED422 with property option. [Simulator](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-giao-dich). Test/Live JSON shape is identical; dedicated Test configuration identifies environment. [Environment isolation](https://developer.sepay.vn/vi/sepay-webhooks/test-mode/so-sanh-voi-live).

## Local Test Mode configuration and G3

Configure locally, never paste values into chat or commit .env:

- SEPAY_TEST_MODE=true only after verifying the account belongs to Test Mode.
- SEPAY_TEST_BANK_NAME: exact gateway emitted by the native test payload (for example MBBank).
- SEPAY_TEST_BANK_CODE: corresponding QR bank identifier (for example MB).
- SEPAY_TEST_ACCOUNT_NUMBER: receiving parent Test Mode account, digits6–64.
- SEPAY_TEST_ACCOUNT_HOLDER: Test Mode holder display text.
- SEPAY_TEST_SUB_ACCOUNT: optional Test Mode VA; leave empty if unused. Instruction/QR displays this VA while matching retains both parent account and VA.
- SEPAY_WEBHOOK_SECRET: separate Test Mode HMAC secret,32–2048 UTF8 bytes, matching the provider webhook.
- stayfinder.payment.demo-usd-vnd-rate and demo-rate-version: labelled demo configuration; edits affect only new payments.

The primary Backend/.env uses the Supabase session pooler on port 5432 after local JDBC recovery; its existing password was not changed or copied. Real SePay values and provider native delivery remain G3. Tests use unmistakably synthetic config in the approved private schema; no provider account or transfer is created by tests.

When an approved reachable test API endpoint is available, configure a SePay Test Mode MoneyIn JSON webhook at /api/payments/webhook/sepay with HMAC and SF prefix plus10 alphanumeric suffix. Use a fresh owned pending bank booking, then the Test Mode dashboard QR simulator and the exact stored VND/reference/receiving account. Inspect native delivery status, durable receipt, and owned booking/payment GETs; retry the same native ID to prove no second consumption. Test QR uses a Test Mode account/VA and no real bank transfer. [Test webhook setup](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/tao-webhook), [QR simulation](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-tao-ma-vietqr).

## Schema and verification

Current scope (2026-10-14): user deferred real SePay Test Mode configuration/delivery until after code and local tests. Signed synthetic native HTTP receipt tests, commit-failure retry, locked FX, idempotency, cancellation/refund and concurrent completion are implementation evidence only. Frozen000–009 were applied solely to stayfinder_test_20261013 (40 tables); no public rollout/seed/provider call was done. The following numbers are earlier transaction checkpoints.

Frozen000–009 were separately approved and applied only to stayfinder_test_20261013. It has40 tables with RLS/no direct client schema usage/no external FKs. Public metadata/count fingerprint was unchanged at G2 postflight. Public migration or persistent demo seed is not approved.

Current evidence:212 non-context/non-PostgreSQL tests pass, including real Spring Security/MVC payment owner/key/body/ACK boundaries and native primitive/receipt/matching/lateness tests. 15 PostgreSQL tests now pass, including four foundation tests, four serial whole-context booking/payment/completion/refund tests and seven real concurrent transaction tests. Concurrency fixtures commit temporarily so other connections can see them, then remove only verified synthetic UUID-owned rows in dependency order; postflight confirms all35 tables empty. JPA ddl-auto=validate passes on the private schema. The latter exercise native signed receipt → exact collection → single confirmation/benefit consumption → paid cancellation → original locked-FX refund request. Actual SePay delivery and broader cancellation/refund/completion race permutations remain to be verified; synthetic native fixture evidence is not provider delivery.
