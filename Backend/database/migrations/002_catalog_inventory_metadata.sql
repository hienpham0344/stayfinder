-- Draft from read-only Supabase metadata 2026-10-13. NOT APPLIED.
-- Caller must set stayfinder.target_schema and search_path to the approved target.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $scope$
BEGIN
 IF current_setting('stayfinder.target_schema',true) IS NULL
    OR current_setting('stayfinder.target_schema',true)<>current_schema()
    OR current_schema() NOT IN ('public','stayfinder_test_20261013') THEN
  RAISE EXCEPTION 'Explicit approved target schema must match current_schema';
 END IF;
END
$scope$;

CREATE TABLE IF NOT EXISTS locations (
 id uuid PRIMARY KEY,city varchar(255) NOT NULL,country varchar(255) NOT NULL
);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS timezone varchar(255);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS cleaning_fee_cents bigint CHECK(cleaning_fee_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS service_fee_cents bigint CHECK(service_fee_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS bedrooms integer CHECK(bedrooms>=0);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS beds integer CHECK(beds>=0);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS baths integer CHECK(baths>=0);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS curated_popular_rank integer CHECK(curated_popular_rank>=0);
ALTER TABLE accommodations ADD COLUMN IF NOT EXISTS curated_recommended_rank integer CHECK(curated_recommended_rank>=0);
ALTER TABLE features ADD COLUMN IF NOT EXISTS icon_key varchar(255);
ALTER TABLE room ADD COLUMN IF NOT EXISTS nightly_price_cents bigint CHECK(nightly_price_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE room ADD COLUMN IF NOT EXISTS max_guests_per_room integer CHECK(max_guests_per_room>0);
ALTER TABLE room ADD COLUMN IF NOT EXISTS stock_total integer CHECK(stock_total>=0);
ALTER TABLE room ADD COLUMN IF NOT EXISTS size_sqm numeric CHECK(size_sqm>0);
ALTER TABLE room ADD COLUMN IF NOT EXISTS bed_type varchar(255);
ALTER TABLE room ADD COLUMN IF NOT EXISTS includes_breakfast boolean;
ALTER TABLE room ADD COLUMN IF NOT EXISTS image_urls text[];
-- Preserve legacy live links and FK behavior; these captured UUIDs survive source deletion.
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS source_room_id uuid;
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS source_accommodation_id uuid;
UPDATE room_snapshot SET source_room_id=room_id WHERE source_room_id IS NULL AND room_id IS NOT NULL;
UPDATE accommodation_snapshot SET source_accommodation_id=accommodation_id WHERE source_accommodation_id IS NULL AND accommodation_id IS NOT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;
CREATE INDEX IF NOT EXISTS ix_room_source_snapshot ON room_snapshot(source_room_id);
CREATE INDEX IF NOT EXISTS ix_accommodation_source_snapshot ON accommodation_snapshot(source_accommodation_id);
CREATE INDEX IF NOT EXISTS ix_booking_inventory_dates ON booking_details(check_in_date,check_out_date);
CREATE INDEX IF NOT EXISTS ix_room_accommodation ON room(accommodation_id);
CREATE TABLE IF NOT EXISTS demo_price_comparisons (
 id uuid PRIMARY KEY,accommodation_id uuid NOT NULL REFERENCES accommodations(id),room_id uuid NOT NULL REFERENCES room(id),
 provider_name varchar(160) NOT NULL,nightly_price_cents bigint NOT NULL CHECK(nightly_price_cents BETWEEN 0 AND 9007199254740991),
 currency varchar(3) NOT NULL CHECK(currency='USD'),includes_fees boolean NOT NULL,
 cleaning_fee_cents bigint CHECK(cleaning_fee_cents BETWEEN 0 AND 9007199254740991),
 service_fee_cents bigint CHECK(service_fee_cents BETWEEN 0 AND 9007199254740991),
 cancellation_code varchar(40) NOT NULL,observed_at timestamptz NOT NULL,
 CONSTRAINT ck_demo_comparison_fee_metadata CHECK(NOT includes_fees OR (cleaning_fee_cents IS NOT NULL AND service_fee_cents IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_demo_comparison_selection ON demo_price_comparisons(accommodation_id,room_id);
-- Legacy numeric prices remain unchanged/unclassified.

DO $access$
DECLARE t text; role_name text;
BEGIN
 FOREACH t IN ARRAY ARRAY['locations','demo_price_comparisons'] LOOP
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',current_schema(),t);
  EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC',current_schema(),t);
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
    EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM %I',current_schema(),t,role_name);
   END IF;
  END LOOP;
 END LOOP;
END
$access$;
COMMIT;
