# SePay Test Mode implementation notes (work in progress)

Transaction Task4 foundation implements exact configured demo FX locking, raw-byte HMAC verification, native payload parsing and opaque reference matching. The current legacy PaymentController/PaymentService/SepayPaymentProvider are still pending replacement; these helpers do not prove payment delivery or collection.

Default demo rate is 25000 VND/USD with labelled version. Lock HALF_UP(USD cents × rate /100) as immutable integer VND/rate/version. Test Mode simulator accepts 1000–499000000 VND; outside this range return PAYMENT_AMOUNT_UNSUPPORTED422 and offer property payment, without changing USD booking terms. [Official simulator limits](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-giao-dich).

Verify X-SePay-Signature (sha256=hex) over the exact timestamp, dot and raw bytes, with X-SePay-Timestamp in seconds within ±300s. Keep a dedicated Test Mode secret with at least32 UTF8 bytes, no fallback authentication. Reject oversized bodies (>64KiB), changed bytes, missing headers and timestamp overflow. Expected UTF8 fixture hash is generated independently by Node crypto. [Official authentication](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc).

Native parsing requires positive integral id/transferAmount and parses transactionDate in Vietnam UTC+7. Duplicate JSON fields, trailing JSON, fractional/coerced amounts and invalid dates are rejected. Future metadata cannot supply bookingId/status authority. Match exactly one SF +10-alphanumeric reference token in content and, when present, the same parsed code.

Receipts still need durable storage before HTTP200/201 success=true acknowledgement, with unique provider/environment/eventId and immutable payload hash. Worker matching must compare stored account/VA/reference/exact VND and hold state, and preserve anomalies for reconciliation. [Native payload/acknowledgement](https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook).

Test and Live use the same JSON shape. Environment must come from dedicated Test Mode configuration/secret/account, rather than a client test_mode field. [Environment isolation](https://developer.sepay.vn/vi/sepay-webhooks/test-mode/so-sanh-voi-live). Generated QR must use verified Test Mode account/VA; dashboard simulation creates test transactions without a bank transfer. [Test QR simulation](https://developer.sepay.vn/vi/tien-ich-khac/test-mode/mo-phong-tao-ma-vietqr).

G3 remains: prepare complete adapter/runtime instructions, configure only Test Mode locally, and capture an actual authenticated native delivery. Primary Backend/.env was inspected only as booleans; adequate secret and test-mode/bank/account/holder configuration are not present. No values copied/printed or external configuration/payment action performed.

G2 remains: no migration/fixture write performed. 000 +001–004 approval is pending for exact stayfinder_test_20261013; 005/006 are later unapproved drafts. Current unit/security-MVC tests do not establish PostgreSQL transaction/locking/rollback or native provider delivery.
