# Reviewed-target migrations

The 2026-10-13 read-only Supabase preflight found 19 empty baseline public tables, no normalized email/favorite duplicates, RLS enabled with no reported policies, and a backend role with RLS bypass. Existing users_id_fkey still references auth.users(id). The user subsequently approved only the frozen test batch 000–004. It was applied successfully on 2026-10-13; public rollout remains unapproved.

The first proposed target is **stayfinder_test_20261013**, on the currently configured database. This exact test schema is approved and now exists with 31 empty tables, RLS on every table, no external foreign keys and no PUBLIC/anon/authenticated schema usage. Public/application migration is a separate gate.

The approved batch was applied in this order (do not rerun bootstrap against the existing schema):

| File | Effect on the named test schema |
|---|---|
| test/000_test_schema_bootstrap.sql | Create a new schema; refuse an existing one; copy baseline structure/checks/PK indexes/FKs only. No rows, defaults, triggers or policies copied. The test-only users → auth.users FK is omitted. |
| migrations/001_spring_identity.sql | Add Spring credentials, normalized email uniqueness, sessions, rotating token hashes and auth audit. It detaches the exact observed auth FK only if present in the approved target. |
| migrations/002_catalog_inventory_metadata.sql | Add nullable USD pricing/stock/capacity/fees/location metadata, immutable snapshot source UUIDs, hold expiry and demo comparison storage. Legacy prices remain unchanged. |
| migrations/003_favorite_uniqueness.sql | Validate ownership/duplicates before enforcing unique owner/stay saves. No row deletion or merge. |
| migrations/004_rewards_idempotency_audit.sql | Add wallet/ledger/claims/reservations, durable request results and audit. No demo balance, password or role is assigned. quote_id FK waits for migration 005. |

Each migration checks stayfinder.target_schema equals current_schema and permits only public or this exact test schema. The test runner must additionally refuse public. Granting test-schema approval does **not** approve public execution even though the reusable migration guard supports a later separately approved public rollout.

The bootstrap refuses reset/drop. All scripts use transactions, lock_timeout=5s and statement_timeout=30s. Failure rolls back its script; scripts already committed are retained for diagnosis. Do not automatically drop columns/schema to undo a failure. No existing public table, account, credential or row is deleted. Public users-to-auth FK transition needs separate exact-target approval.

New sensitive tables enable RLS and remove direct PUBLIC/anon/authenticated grants. The configured backend role uses server-side Spring authorization. Existing user UUIDs and legacy numeric prices remain intact. Unenrolled accounts cannot log in; no default passwords are assigned.

Verification: 181 non-context/non-PostgreSQL backend tests passed at the preceding checkpoint; 46 frontend tests/typecheck/web export passed. Four opt-in PostgreSQL tests now pass against the approved test schema: source/snapshot identity and half-open holds; catalog/wishlist SQL and daily stock; normalized email/favorite/ledger uniqueness; production transaction advisory mutex blocking/release. All synthetic fixture writes roll back. This does not yet prove full auth/reward service concurrency or booking/payment integration. Later booking/payment/experience migrations and shared deployment still require concrete review.

Migrations 005/006 are later unexecuted quote/snapshot/booking/outbox/payment/refund drafts and are NOT part of this approval batch. PostgreSQL fixture tests additionally require exact-schema/approval properties and are excluded from the non-DB suite via the postgres tag; exclusion is a runtime gate, not database verification.

No seeds are included in this approval batch. Fake fixtures used by later tests must verify the exact test schema before writes and never copy public rows.

Applied-batch evidence is recorded in the execution ledger and ignored QA logs. The tracked ApprovedBatchRunner validates the frozen manifest and refuses any existing target; it is not a reset tool. Both runner and test JDBC connections disable server named prepares (prepareThreshold=0). Runtime Hikari uses the same setting for Supabase pool compatibility. Runner guard/search_path settings are transaction-local so they stay with the migration transaction.

Run opt-in fixture tests only with the exact schema/approval/envFile properties documented in PostgresTestTarget; use -Dgroups=postgres -DexcludedGroups= and select SnapshotIdentityIntegrationTest,CatalogPostgresIntegrationTest,ApprovedSchemaPostgresIntegrationTest. Never put connection strings or passwords in command arguments. Whole-context validation requires later separately reviewed migrations; ddl-auto remains validate.
