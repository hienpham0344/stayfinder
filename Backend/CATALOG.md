# Catalog rollout and verification

C01–C06 use public DTOs and ApiResponse. Search validates paired dates, 1–90 nights, adults/children 1–20/0–20, quantity 1–10, safe USD-cent bounds and all selected amenities. Unknown query names and ambiguous guests/adults/children aliases return VALIDATION_ERROR. Sorting uses a fixed allowlist plus UUID ties.

New USD prices belong to room.nightly_price_cents. Legacy room.price/accommodations.base_price are retained without implicit conversion. Properties need classified fees, location and an IANA timezone before live listing. Unknown host/factual fields remain absent/null. Room includesBreakfast is nullable when source metadata is unknown; consumers must hide that fact.

Availability resolves snapshots to source room IDs and subtracts the peak occupied quantity on each night. Known expired pending holds no longer occupy stock; unmapped active source, quantity or date data blocks affected tiers. Booking creation must later lock the same source tier and recheck this policy.

Search/read projections use the existing NamedParameterJdbcTemplate for PostgreSQL daily inventory/lateral aggregates, avoiding per-card image/review/favorite queries. Services retain transactions and ownership; controllers do not query persistence. Favorite flags use the current principal only. Comparison uses stored demo offers and owned room prices, echoes the complete selection and ranks only offers with matching USD/full fees/cancellation basis.

Proposed mappings awaiting G2 review/application (current baseline metadata verified read-only on 2026-10-13):
- room: nightly_price_cents, stock_total, max_guests_per_room, size_sqm, bed_type, includes_breakfast, image_urls (text array).
- accommodations: location_id, timezone, cleaning_fee_cents, service_fee_cents, bedrooms/beds/baths, curated ranks.
- features.icon_key; locations(id,city,country); demo_price_comparisons offer/fee/currency/condition/observation columns.
- room_snapshot.source_room_id; accommodation_snapshot.source_accommodation_id; bookings.hold_expires_at.

The restored database was inspected read-only on 2026-10-13: all baseline tables are empty, and these new columns/tables are absent. Existing snapshot links are room_snapshot.room_id and accommodation_snapshot.accommodation_id, both ON DELETE SET NULL; reviewed additive source columns must retain immutable source identities. No DDL or row mutation was executed. Actual SQL/pagination/aggregate/stock behavior and snapshot compatibility require the isolated PostgreSQL tests after G2 approval. Unit/MVC tests cover policies, DTO/service behavior and HTTP binding only.
