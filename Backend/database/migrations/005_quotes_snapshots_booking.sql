-- DRAFT, NOT APPLIED. Later G2 batch; NOT part of frozen 000 +001-004 approval.
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

-- Add captured payloads to observed snapshot tables; retain legacy live FK columns and immutable source UUIDs from 002.
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS nightly_price_cents bigint CHECK(nightly_price_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS currency varchar(3) CHECK(currency='USD');
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS max_guests_per_room integer CHECK(max_guests_per_room>0);
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS size_sqm numeric CHECK(size_sqm>0);
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS bed_type varchar(255);
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS includes_breakfast boolean;
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS image_urls text[];
ALTER TABLE room_snapshot ADD COLUMN IF NOT EXISTS captured_at timestamptz;
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS timezone varchar(255);
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS cleaning_fee_cents bigint CHECK(cleaning_fee_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS service_fee_cents bigint CHECK(service_fee_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE accommodation_snapshot ADD COLUMN IF NOT EXISTS captured_at timestamptz;
-- Only a verified settlement operation sets paid_at. No legacy status/amount is automatically classified as paid USD.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE TABLE booking_quotes (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),
 accommodation_id uuid NOT NULL,room_id uuid NOT NULL,
 check_in date NOT NULL,check_out date NOT NULL CHECK(check_out>check_in AND check_out-check_in<=90),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10),adults integer NOT NULL CHECK(adults BETWEEN 1 AND 20),
 children integer NOT NULL CHECK(children BETWEEN 0 AND 20),max_guests_per_room integer NOT NULL CHECK(max_guests_per_room>0),
 voucher_id uuid REFERENCES reward_claims(id),reward_points integer NOT NULL CHECK(reward_points>=0 AND reward_points%100=0),
 reserved_points bigint NOT NULL CHECK(reserved_points BETWEEN 0 AND 9007199254740991),
 discount_source varchar(16) NOT NULL CHECK(discount_source IN ('none','points','voucher')),
 nights integer NOT NULL CHECK(nights=check_out-check_in),price_version bigint NOT NULL CHECK(price_version BETWEEN 1 AND 9007199254740991),
 nightly_price_cents bigint NOT NULL CHECK(nightly_price_cents BETWEEN 0 AND 9007199254740991),
 room_subtotal_cents bigint NOT NULL CHECK(room_subtotal_cents BETWEEN 0 AND 9007199254740991),
 cleaning_fee_cents bigint NOT NULL CHECK(cleaning_fee_cents BETWEEN 0 AND 9007199254740991),
 service_fee_cents bigint NOT NULL CHECK(service_fee_cents BETWEEN 0 AND 9007199254740991),
 tax_cents bigint NOT NULL CHECK(tax_cents=0),
 discount_cents bigint NOT NULL CHECK(discount_cents BETWEEN 0 AND room_subtotal_cents),
 total_cents bigint NOT NULL CHECK(total_cents BETWEEN 0 AND 9007199254740991),
 timezone varchar(255) NOT NULL,created_at timestamptz NOT NULL,expires_at timestamptz NOT NULL CHECK(expires_at=created_at+interval '10 minutes'),
 consumed_booking_id uuid UNIQUE REFERENCES bookings(id),
 CHECK(room_subtotal_cents=nightly_price_cents*nights*quantity),
 CHECK(total_cents=room_subtotal_cents+cleaning_fee_cents+service_fee_cents+tax_cents-discount_cents),
 CHECK(adults::bigint+children<=max_guests_per_room::bigint*quantity),
 CHECK((discount_source='none' AND discount_cents=0 AND reserved_points=0 AND voucher_id IS NULL)
    OR (discount_source='points' AND discount_cents=reserved_points AND reserved_points>0 AND reserved_points%100=0 AND voucher_id IS NULL)
    OR (discount_source='voucher' AND reserved_points=0 AND voucher_id IS NOT NULL AND reward_points=0))
);
CREATE INDEX ix_quote_owner_created ON booking_quotes(user_id,created_at DESC,id);
ALTER TABLE reward_reservations ADD CONSTRAINT reward_reservations_quote_fk FOREIGN KEY(quote_id) REFERENCES booking_quotes(id);

DO $access$
DECLARE role_name text;
BEGIN
 ALTER TABLE booking_quotes ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON TABLE booking_quotes FROM PUBLIC;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.booking_quotes FROM %I',current_schema(),role_name);
  END IF;
 END LOOP;
END
$access$;
COMMIT;
