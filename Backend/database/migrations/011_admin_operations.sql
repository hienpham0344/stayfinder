-- Prepared migration; do not apply until the exact target schema is approved.
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
END $scope$;
ALTER TABLE reviews ADD COLUMN hidden boolean NOT NULL DEFAULT false;
ALTER TABLE accommodations ADD COLUMN moderation_blocked boolean NOT NULL DEFAULT false;
ALTER TABLE support_reports DROP CONSTRAINT support_reports_status_check;
ALTER TABLE support_reports ADD CONSTRAINT support_reports_status_check
 CHECK(status IN ('submitted','in_review','resolved','dismissed'));
CREATE TABLE admin_audit_events(
 id uuid PRIMARY KEY,
 actor_id uuid NOT NULL REFERENCES users(id),
 action varchar(64) NOT NULL,
 target varchar(100) NOT NULL,
 reason varchar(500) NOT NULL,
 created_at timestamptz NOT NULL
);
CREATE INDEX ix_admin_audit_created ON admin_audit_events(created_at DESC,id);
CREATE TABLE system_settings(
 setting_key varchar(64) PRIMARY KEY CHECK(setting_key IN ('SUPPORT_EMAIL','SUPPORT_RESPONSE_HOURS')),
 setting_value varchar(200) NOT NULL,
 updated_by uuid NOT NULL REFERENCES users(id),
 updated_at timestamptz NOT NULL
);
ALTER TABLE admin_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DO $access$
DECLARE role_name text;
BEGIN
 EXECUTE format('REVOKE ALL ON TABLE %I.admin_audit_events,%I.system_settings FROM PUBLIC',current_schema(),current_schema());
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.admin_audit_events,%I.system_settings FROM %I',current_schema(),current_schema(),role_name);
  END IF;
 END LOOP;
END $access$;
COMMIT;
