# Rewards and idempotency rollout

Wallet/ledger state is authoritative. Public auth/profile points derive from the wallet rather than historical users cache values. A missing wallet means zero points, not a demo credit. Tier uses lifetime earnings: Silver below 10,000, Gold from 10,000, VIP from 25,000.

100 points reduce 100 USD room cents. Requested points use whole 100-point blocks and must be available; the backend caps actual reserved/redemption points at 20% of room subtotal rounded down to a whole block. Flat fees are not discounted. Voucher and points are exclusive. Fixed demo offers/terms are validated against the approved costs and 30-day rules.

Claim snapshots preserve owned terms/expiry after offer changes. A claim debit and entitlement, audit and idempotent JSON result share the same transaction. Reserve reduces available/increases held points; settlement consumes the hold; unpaid release restores once. Refund restores consumed benefits once; an expired voucher remains expired. Only the forthcoming paid/local-checkout booking completion service calls earning.

Financial lock order is wallet initialization user mutex → owner wallet → source room → booking → payment → benefit claim. Idempotency separately uses a transaction-scoped PostgreSQL advisory mutex keyed by actor/operation/key, before domain locks; it does not pessimistically lock an ADMIN actor's wallet while acting for another customer. Persisted full keys/hashes/results distinguish any advisory hash collision.

W01–W05 require the authenticated principal; client owner/balance fields are rejected. Missing Idempotency-Key is VALIDATION_ERROR. Claims cannot spend held points. Demo seed credit must be an explicit labeled ledger entry for a designated fixture/account, never a registration default.

Database mappings/migration 004 are draft and unexecuted. Existing empty loyalty_points_history cannot represent source-keyed held/consumed/restored benefits and is preserved unchanged. Real PostgreSQL concurrency/rollback tests remain G2-gated.

Task 3 must attach the durable outbox publisher to reward claim/earning operations once that port exists; no production notification claim is made yet.
