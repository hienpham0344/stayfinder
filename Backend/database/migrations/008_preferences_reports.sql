-- DRAFT, NOT APPLIED. New G2 approval required; public rollout separate.
-- Additive only; no data copy, seed, external messaging or legacy reports rewrite.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s';
DO $scope$
BEGIN
 IF current_setting('stayfinder.target_schema',true) IS NULL
    OR current_setting('stayfinder.target_schema',true)<>current_schema()
    OR current_schema() NOT IN ('public','stayfinder_test_20261013') THEN
  RAISE EXCEPTION 'Explicit approved target schema must match current_schema';
 END IF;
END $scope$;
CREATE TABLE user_preferences(
 user_id uuid PRIMARY KEY REFERENCES users(id),
 language varchar(16) NOT NULL DEFAULT 'en-US' CHECK(language IN ('en-US','vi-VN','fr-FR')),
 booking_notifications boolean NOT NULL DEFAULT true
);
CREATE TABLE support_reports(
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 booking_id uuid,
 category varchar(32) NOT NULL CHECK(category IN ('Booking','Payment','Account','Rewards','Other')),
 description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 5000),
 status varchar(32) NOT NULL CHECK(status='submitted'),
 created_at timestamptz NOT NULL,
 CONSTRAINT fk_support_booking_owner FOREIGN KEY(booking_id,user_id) REFERENCES bookings(id,user_id)
);
CREATE INDEX ix_support_owner_created ON support_reports(user_id,created_at DESC,id DESC);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_reports ENABLE ROW LEVEL SECURITY;
DO $access$
DECLARE role_name text;
BEGIN
 EXECUTE format('REVOKE ALL ON TABLE %I.user_preferences,%I.support_reports FROM PUBLIC',current_schema(),current_schema());
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.user_preferences,%I.support_reports FROM %I',current_schema(),current_schema(),role_name);
  END IF;
 END LOOP;
END $access$;
COMMIT;
