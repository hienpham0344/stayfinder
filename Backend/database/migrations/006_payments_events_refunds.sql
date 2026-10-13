-- DRAFT, NOT APPLIED. Later G2 batch, not part of frozen 000 +001-004.
-- Classified USD ledger, locked Test Mode VND instructions, native receipts/conflicts and linked refund requests.
-- No seed, public rollout or provider action is authorized by this draft.
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
-- Classified payment fields are nullable for preserved legacy rows; no legacy amount/status is reinterpreted.
ALTER TABLE bookings ADD CONSTRAINT uq_booking_id_owner UNIQUE(id,user_id);
ALTER TABLE payments ADD COLUMN user_id uuid REFERENCES users(id);
ALTER TABLE payments ADD COLUMN original_amount_cents bigint CHECK(original_amount_cents BETWEEN 0 AND 9007199254740991);
ALTER TABLE payments ADD COLUMN method varchar(32) CHECK(method IN ('bank_transfer','pay_at_property'));
ALTER TABLE payments ADD COLUMN provider varchar(32);
ALTER TABLE payments ADD COLUMN environment varchar(16);
ALTER TABLE payments ADD COLUMN expires_at timestamptz;
ALTER TABLE payments ADD COLUMN collected_at timestamptz;
ALTER TABLE payments ADD COLUMN reconciliation_status varchar(16) CHECK(reconciliation_status IN ('none','required'));
ALTER TABLE payments ADD COLUMN refund_status varchar(16) CHECK(refund_status IN ('none','requested','confirmed'));
ALTER TABLE payments ADD COLUMN settlement_vnd bigint CHECK(settlement_vnd BETWEEN 1000 AND 499000000);
ALTER TABLE payments ADD COLUMN usd_to_vnd_rate varchar(64);
ALTER TABLE payments ADD COLUMN rate_version varchar(120);
ALTER TABLE payments ADD COLUMN transfer_reference varchar(12);
ALTER TABLE payments ADD COLUMN bank_name varchar(160);
ALTER TABLE payments ADD COLUMN bank_code varchar(32);
ALTER TABLE payments ADD COLUMN bank_account_number varchar(64);
ALTER TABLE payments ADD COLUMN bank_sub_account varchar(64);
ALTER TABLE payments ADD COLUMN bank_account_holder varchar(160);
ALTER TABLE payments ADD COLUMN qr_image_url text;
ALTER TABLE payments ADD CONSTRAINT payments_owned_booking_fk FOREIGN KEY(booking_id,user_id) REFERENCES bookings(id,user_id);
ALTER TABLE payments ADD CONSTRAINT uq_payment_id_booking_owner UNIQUE(id,booking_id,user_id);
CREATE UNIQUE INDEX uq_classified_payment_booking ON payments(booking_id) WHERE original_amount_cents IS NOT NULL;
CREATE UNIQUE INDEX uq_payment_transfer_reference ON payments(transfer_reference) WHERE transfer_reference IS NOT NULL;
CREATE UNIQUE INDEX uq_classified_payment_transaction ON payments(transaction_id) WHERE original_amount_cents IS NOT NULL AND transaction_id IS NOT NULL;
ALTER TABLE payments ADD CONSTRAINT ck_classified_payment CHECK(original_amount_cents IS NULL OR (
 booking_id IS NOT NULL AND user_id IS NOT NULL AND method IS NOT NULL AND provider IS NOT NULL
 AND status IS NOT NULL AND created_at IS NOT NULL AND amount IS NOT NULL AND amount=original_amount_cents::numeric/100
 AND reconciliation_status IS NOT NULL AND refund_status IS NOT NULL
 AND (status NOT IN ('success','refunded') OR collected_at IS NOT NULL)
 AND ((method='bank_transfer' AND provider='sepay' AND environment IS NOT NULL AND environment='test' AND expires_at IS NOT NULL
   AND settlement_vnd IS NOT NULL AND usd_to_vnd_rate IS NOT NULL AND rate_version IS NOT NULL
   AND transfer_reference IS NOT NULL AND transfer_reference ~ '^SF[A-Z0-9]{10}$'
   AND bank_name IS NOT NULL AND length(btrim(bank_name)) BETWEEN 1 AND 160
   AND bank_code IS NOT NULL AND bank_code ~ '^[A-Za-z0-9]{2,32}$'
   AND bank_account_number IS NOT NULL AND bank_account_number ~ '^[0-9]{6,64}$'
   AND bank_account_holder IS NOT NULL AND length(btrim(bank_account_holder)) BETWEEN 1 AND 160 AND qr_image_url IS NOT NULL)
  OR (method='pay_at_property' AND provider='property' AND environment IS NULL AND expires_at IS NULL
   AND settlement_vnd IS NULL AND usd_to_vnd_rate IS NULL AND rate_version IS NULL AND transfer_reference IS NULL
   AND bank_name IS NULL AND bank_code IS NULL AND bank_account_number IS NULL AND bank_sub_account IS NULL AND bank_account_holder IS NULL AND qr_image_url IS NULL))
));
CREATE TABLE payment_webhook_events (
 id uuid PRIMARY KEY,provider varchar(32) NOT NULL CHECK(provider='sepay'),environment varchar(16) NOT NULL CHECK(environment='test'),
 event_id varchar(32) NOT NULL,payload_hash varchar(64) NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
 gateway varchar(160) NOT NULL,transaction_at timestamptz NOT NULL,account_number varchar(64) NOT NULL,sub_account varchar(64),
 code varchar(100),content varchar(4096) NOT NULL,transfer_type varchar(3) NOT NULL CHECK(transfer_type IN ('in','out')),
 transfer_amount bigint NOT NULL CHECK(transfer_amount BETWEEN 1 AND 9007199254740991),reference_code varchar(160),
 received_at timestamptz NOT NULL,processing_status varchar(32) NOT NULL CHECK(processing_status IN ('received','applied','ignored','reconciliation')),
 resolution_reason varchar(80),payment_id uuid REFERENCES payments(id),processed_at timestamptz,
 conflict_count integer NOT NULL DEFAULT 0 CHECK(conflict_count>=0),
 handled_conflict_count integer NOT NULL DEFAULT 0 CHECK(handled_conflict_count BETWEEN 0 AND conflict_count),
 last_conflict_hash varchar(64) CHECK(last_conflict_hash ~ '^[a-f0-9]{64}$'),last_conflict_at timestamptz,
 CONSTRAINT uq_native_sepay_event UNIQUE(provider,environment,event_id),
 CHECK(processing_status<>'applied' OR (payment_id IS NOT NULL AND processed_at IS NOT NULL)),
 CHECK(conflict_count=0 OR (last_conflict_hash IS NOT NULL AND last_conflict_at IS NOT NULL))
);
CREATE INDEX ix_payment_receipt_work ON payment_webhook_events(received_at,id) WHERE processing_status='received' OR conflict_count>handled_conflict_count;
-- Only parsed verified fields and immutable body hash are retained, never HMAC secret/header or full raw body.
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE payment_webhook_events, payments FROM PUBLIC;

CREATE TABLE refund_requests (
 id uuid PRIMARY KEY,booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),user_id uuid NOT NULL REFERENCES users(id),
 payment_id uuid NOT NULL REFERENCES payments(id),amount_usd_cents bigint NOT NULL CHECK(amount_usd_cents BETWEEN 0 AND 9007199254740991),
 settlement_vnd bigint CHECK(settlement_vnd BETWEEN 0 AND 9007199254740991),usd_to_vnd_rate varchar(64),rate_version varchar(120),
 status varchar(32) NOT NULL CHECK(status IN ('requested','confirmed')),requested_at timestamptz NOT NULL,
 confirmed_at timestamptz,confirmed_by uuid REFERENCES users(id),reference varchar(120),
 CONSTRAINT refund_original_owned_payment_fk FOREIGN KEY(payment_id,booking_id,user_id) REFERENCES payments(id,booking_id,user_id),
 CHECK((settlement_vnd IS NULL AND usd_to_vnd_rate IS NULL AND rate_version IS NULL)
    OR (settlement_vnd IS NOT NULL AND usd_to_vnd_rate IS NOT NULL AND rate_version IS NOT NULL)),
 CHECK((status='requested' AND confirmed_at IS NULL AND confirmed_by IS NULL AND reference IS NULL)
    OR (status='confirmed' AND confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL AND reference IS NOT NULL AND length(btrim(reference)) BETWEEN 1 AND 120))
);
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE refund_requests FROM PUBLIC;
DO $access$
DECLARE role_name text;
BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.refund_requests, %I.payment_webhook_events, %I.payments FROM %I',current_schema(),current_schema(),current_schema(),role_name);
  END IF;
 END LOOP;
END
$access$;
COMMIT;
