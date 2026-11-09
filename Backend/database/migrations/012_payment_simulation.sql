-- NOT APPLIED. Apply only to an explicitly selected test/demo schema after review.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $scope$
BEGIN
 IF current_setting('stayfinder.target_schema', true) IS NULL
    OR current_setting('stayfinder.target_schema', true) <> current_schema()
    OR current_schema() NOT IN ('public', 'stayfinder_test_20261013') THEN
  RAISE EXCEPTION 'Explicit approved target schema must match current_schema';
 END IF;
END $scope$;
CREATE TABLE payment_simulation_attempts (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 booking_id uuid NOT NULL REFERENCES bookings(id),
 payment_id uuid NOT NULL REFERENCES payments(id),
 outcome varchar(16) NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'CANCEL')),
 payment_status varchar(16) NOT NULL CHECK (payment_status IN ('pending', 'success')),
 created_at timestamptz NOT NULL,
 CONSTRAINT ck_simulation_outcome CHECK (
   (outcome = 'SUCCESS' AND payment_status = 'success') OR
   (outcome IN ('FAILURE', 'CANCEL') AND payment_status = 'pending'))
);
CREATE INDEX ix_simulation_owner_booking ON payment_simulation_attempts(user_id, booking_id, created_at DESC, id DESC);
ALTER TABLE payment_simulation_attempts ENABLE ROW LEVEL SECURITY;
-- No direct client policies: access is exclusively through Spring's owner-scoped service.
COMMIT;
