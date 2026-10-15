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

CREATE TABLE IF NOT EXISTS reward_wallets (
 user_id uuid PRIMARY KEY REFERENCES users(id),available_points bigint NOT NULL DEFAULT 0 CHECK(available_points BETWEEN 0 AND 9007199254740991),
 reserved_points bigint NOT NULL DEFAULT 0 CHECK(reserved_points BETWEEN 0 AND 9007199254740991),
 lifetime_earned_points bigint NOT NULL DEFAULT 0 CHECK(lifetime_earned_points BETWEEN 0 AND 9007199254740991)
);
CREATE TABLE IF NOT EXISTS reward_offers (
 id uuid PRIMARY KEY,code varchar(40) NOT NULL UNIQUE,title varchar(160) NOT NULL,kind varchar(32) NOT NULL,
 points_cost bigint NOT NULL CHECK(points_cost>0),active boolean NOT NULL,
 valid_from timestamptz,valid_until timestamptz,validity_days integer NOT NULL CHECK(validity_days=30),
 discount_percent integer CHECK(discount_percent BETWEEN 1 AND 20),
 discount_cap_cents bigint CHECK(discount_cap_cents BETWEEN 0 AND 9007199254740991),
 minimum_room_subtotal_cents bigint CHECK(minimum_room_subtotal_cents BETWEEN 0 AND 9007199254740991),
 benefit_value_cents bigint CHECK(benefit_value_cents BETWEEN 0 AND 9007199254740991),
 fulfilment_description text NOT NULL,
 CHECK(kind IN ('breakfast','room_upgrade','spa_credit','discount_voucher'))
);
CREATE TABLE IF NOT EXISTS reward_claims (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),offer_id uuid NOT NULL REFERENCES reward_offers(id),
 status varchar(32) NOT NULL CHECK(status IN ('available','reserved','used','expired')),created_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 offer_code varchar(40) NOT NULL,offer_title varchar(160) NOT NULL,kind varchar(32) NOT NULL,points_cost bigint NOT NULL,
 validity_days integer NOT NULL,discount_percent integer,discount_cap_cents bigint,minimum_room_subtotal_cents bigint,benefit_value_cents bigint,
 fulfilment_description text NOT NULL,CHECK(expires_at>created_at)
);
CREATE INDEX IF NOT EXISTS ix_reward_claim_owner ON reward_claims(user_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS reward_reservations (
 booking_id uuid PRIMARY KEY REFERENCES bookings(id),user_id uuid NOT NULL REFERENCES users(id),quote_id uuid NOT NULL,
 voucher_claim_id uuid REFERENCES reward_claims(id),reserved_points bigint NOT NULL CHECK(reserved_points BETWEEN 0 AND 9007199254740991),
 discount_cents bigint NOT NULL CHECK(discount_cents BETWEEN 0 AND 9007199254740991),source varchar(16) NOT NULL,
 state varchar(16) NOT NULL CHECK(state IN ('reserved','consumed','released','restored')),created_at timestamptz NOT NULL,processed_at timestamptz,
 CHECK(source IN ('none','points','voucher')),
 CHECK((source='none' AND reserved_points=0 AND discount_cents=0 AND voucher_claim_id IS NULL)
   OR (source='points' AND reserved_points>0 AND reserved_points%100=0 AND discount_cents=reserved_points AND voucher_claim_id IS NULL)
   OR (source='voucher' AND reserved_points=0 AND voucher_claim_id IS NOT NULL))
);
-- quote_id FK is added with booking_quotes in migration 005.
CREATE TABLE IF NOT EXISTS reward_ledger_entries (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),kind varchar(32) NOT NULL,delta_points bigint NOT NULL,
 source_type varchar(32) NOT NULL,source_id uuid NOT NULL,source_key varchar(128) NOT NULL,balance_after bigint NOT NULL CHECK(balance_after BETWEEN 0 AND 9007199254740991),
 basis_usd_cents bigint CHECK(basis_usd_cents BETWEEN 0 AND 9007199254740991),created_at timestamptz NOT NULL,title varchar(160) NOT NULL,
 CONSTRAINT uq_reward_ledger_source UNIQUE(user_id,source_key)
);
CREATE INDEX IF NOT EXISTS ix_reward_ledger_owner ON reward_ledger_entries(user_id,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS idempotency_records (
 id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),operation varchar(64) NOT NULL,request_key varchar(128) NOT NULL,
 request_hash varchar(64) NOT NULL,result_type varchar(512) NOT NULL,result_json text NOT NULL,created_at timestamptz NOT NULL,
 CONSTRAINT uq_idempotency_owner_operation_key UNIQUE(user_id,operation,request_key)
);
CREATE TABLE IF NOT EXISTS audit_records (
 id uuid PRIMARY KEY,actor_id uuid NOT NULL REFERENCES users(id),source_id uuid NOT NULL,action varchar(64) NOT NULL,occurred_at timestamptz NOT NULL
);
-- Existing users' cached points and legacy loyalty_points_history are not imported.
-- No demo credits/passwords/roles are granted by this migration.

DO $access$
DECLARE t text; role_name text;
BEGIN
 FOREACH t IN ARRAY ARRAY['reward_wallets','reward_offers','reward_claims','reward_reservations','reward_ledger_entries','idempotency_records','audit_records'] LOOP
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
