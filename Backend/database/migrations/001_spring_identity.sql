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

DO $identity$
DECLARE fk record;
BEGIN
 IF EXISTS(SELECT 1 FROM (SELECT lower(btrim(email)) FROM users WHERE email IS NOT NULL GROUP BY lower(btrim(email)) HAVING count(*)>1) d) THEN
  RAISE EXCEPTION 'Duplicate normalized emails require reviewed remediation';
 END IF;
 SELECT k.conname,tn.nspname AS target_schema,tc.relname AS target_table,pg_get_constraintdef(k.oid) AS definition INTO fk
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_class tc ON tc.oid=k.confrelid JOIN pg_namespace tn ON tn.oid=tc.relnamespace
 WHERE n.nspname=current_schema() AND c.relname='users' AND k.conname='users_id_fkey';
 IF FOUND THEN
  IF fk.target_schema<>'auth' OR fk.target_table<>'users'
     OR fk.definition<>'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE'
  THEN RAISE EXCEPTION 'users_id_fkey differs from the exact observed constraint'; END IF;
  -- Public execution needs its own G2 approval. No auth.users row is altered.
  EXECUTE format('ALTER TABLE %I.users DROP CONSTRAINT users_id_fkey',current_schema());
 END IF;
END
$identity$;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credential_state varchar(32) NOT NULL DEFAULT 'pending_enrollment';
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_normalized_email ON users (lower(btrim(email))) WHERE email IS NOT NULL;
CREATE TABLE IF NOT EXISTS auth_sessions (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),
 created_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,revoked_at timestamptz,
 CONSTRAINT ck_auth_session_expiry CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_owner ON auth_sessions(user_id);
CREATE TABLE IF NOT EXISTS refresh_tokens (
 id uuid PRIMARY KEY,session_id uuid NOT NULL REFERENCES auth_sessions(id),
 token_hash varchar(64) NOT NULL UNIQUE,issued_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 consumed_at timestamptz,replaced_by uuid,
 CONSTRAINT ck_refresh_expiry CHECK(expires_at>issued_at)
);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_session ON refresh_tokens(session_id);
CREATE TABLE IF NOT EXISTS auth_audit_events (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),
 action varchar(40) NOT NULL,occurred_at timestamptz NOT NULL
);

DO $access$
DECLARE t text; role_name text;
BEGIN
 FOREACH t IN ARRAY ARRAY['users','auth_sessions','refresh_tokens','auth_audit_events'] LOOP
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
