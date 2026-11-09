# Mock multi-source price comparison

`PriceOfferSource` is the adapter boundary. `PriceComparisonService` collects every adapter's normalized `RawDemoOffer`, validates source metadata, and computes all totals for the same room, nights and room quantity. Only equivalent cancellation terms and fee-inclusive totals qualify for best value.

Sources:

1. `DemoPriceOfferRepository`: persisted seed offers in integer USD cents.
2. `MockDecimalPriceSource`: fictional decimal-dollar payload, exact conversion to cents; no rounding of fractional cents, negative amounts or overflow.
3. `MockMinorUnitPriceSource`: fictional nested amount/currency payload; explicitly excludes fees and cannot win a fee-inclusive comparison.

Set `stayfinder.catalog.mock-sources-enabled=true` (environment `STAYFINDER_CATALOG_MOCK_SOURCES_ENABLED=true`) only for demonstrations. Default false retains the existing seed-only behavior. Synthetic adapters use fixed example rates for each requested available room; these are not real availability or prices from a provider. Results carry the existing `isDemo` flag. No external websites are scraped or called.

The catalog DB is still required to establish valid accommodation, room availability and direct prices. This change does not make the full API independent of PostgreSQL. Seed script `database/demo/001_catalog_seed.sql` remains unapplied.

Offline verification: `MockPriceSourceTest` and `PriceComparisonServiceTest` cover adapter shape conversion, invalid currency/precision, opt-in behavior and common-trip comparison. Diagram mapping: UC-USER-07, ACT-04, SEQ-04.
