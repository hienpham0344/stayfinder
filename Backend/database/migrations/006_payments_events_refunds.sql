-- DRAFT, NOT APPLIED. Later G2 batch, not part of frozen 000 +001-004.
-- Payment/receipt mappings are extended by transactions Task 4 before review/application.
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
CREATE TABLE refund_requests (
 id uuid PRIMARY KEY,booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),user_id uuid NOT NULL REFERENCES users(id),
 payment_id uuid NOT NULL REFERENCES payments(id),amount_usd_cents bigint NOT NULL CHECK(amount_usd_cents BETWEEN 0 AND 9007199254740991),
 settlement_vnd bigint CHECK(settlement_vnd BETWEEN 0 AND 9007199254740991),usd_to_vnd_rate varchar(64),rate_version varchar(120),
 status varchar(32) NOT NULL CHECK(status IN ('requested','confirmed')),requested_at timestamptz NOT NULL,
 confirmed_at timestamptz,confirmed_by uuid REFERENCES users(id),reference varchar(120),
 CHECK((settlement_vnd IS NULL AND usd_to_vnd_rate IS NULL AND rate_version IS NULL)
    OR (settlement_vnd IS NOT NULL AND usd_to_vnd_rate IS NOT NULL AND rate_version IS NOT NULL)),
 CHECK((status='requested' AND confirmed_at IS NULL AND confirmed_by IS NULL AND reference IS NULL)
    OR (status='confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL AND length(btrim(reference)) BETWEEN 1 AND 120))
);
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE refund_requests FROM PUBLIC;
DO $access$
DECLARE role_name text;
BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.refund_requests FROM %I',current_schema(),role_name);
  END IF;
 END LOOP;
END
$access$;
COMMIT;
