# StayFinder backend

Java 21 / Spring Boot / PostgreSQL API for CUSTOMER, PARTNER and ADMIN. Public response envelopes remain `ApiResponse<T>`; money is whole VND, payment is SePay sandbox.

- CUSTOMER: local authentication/profile/password/logout, filtered catalog, availability, wishlist, one-room booking/cancellation, signed payment, reviews, reward vouchers and heuristic recommendations.
- PARTNER: application approval, owned properties/rooms/prices/amenities/images, moderation resubmission, owned booking/payment views and statistics.
- ADMIN: account roles/locking with last-admin protection, partner/property/review moderation, booking/payment/reconciliation views, reward catalog, statistics and audit logs.

For configuration, migration precautions, test commands, concurrency rules and benchmark reproduction, see [operation guide](docs/OPERATIONS.md).

- [OpenAPI contract](docs/openapi.yaml)
- [Audit and verification report](BACKEND_AUDIT.md)
- [Synthetic benchmark fixture](db/fixtures/benchmark.sql)

From `Backend/`, use `bash ./mvnw test` for unit/HTTP tests; `bash scripts/test-database.sh` provisions migrations only into an empty disposable local test schema and runs PostgreSQL integration verification. Normal application startup still requires locally configured database/JWT/SePay variables and does not migrate schema automatically.

No OAuth, email/reset-password service, real refunds, multi-room orders, admin/partner UI, shared Redis cache or external AI recommendation service is included.
