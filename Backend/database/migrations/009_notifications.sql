-- DRAFT, NOT APPLIED. New G2 approval required; public rollout separate.
-- Durable in-app inbox only. No external messages/seed/backfill.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='30s';
DO $scope$
BEGIN
 IF current_setting('stayfinder.target_schema',true) IS NULL
    OR current_setting('stayfinder.target_schema',true)<>current_schema()
    OR current_schema() NOT IN ('public','stayfinder_test_20261013') THEN
  RAISE EXCEPTION 'Explicit approved target schema must match current_schema';
 END IF;
 IF EXISTS(SELECT 1 FROM outbox_events WHERE materialized_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Historical materialized events require explicit reviewed remediation';
 END IF;
END $scope$;
ALTER TABLE outbox_events ADD COLUMN materialization_status varchar(32);
ALTER TABLE outbox_events ADD CONSTRAINT uq_outbox_id_owner UNIQUE(id,user_id);
ALTER TABLE outbox_events ADD CONSTRAINT ck_outbox_materialization CHECK(
 (materialized_at IS NULL AND materialization_status IS NULL) OR
 (materialized_at IS NOT NULL AND materialization_status IN ('delivered','suppressed','unsupported','invalid_source'))
);
CREATE INDEX ix_outbox_pending_delivery ON outbox_events(occurred_at,id) WHERE materialized_at IS NULL;
CREATE TABLE notification_inbox_state(
 user_id uuid PRIMARY KEY REFERENCES users(id),
 latest_snapshot timestamptz NOT NULL
);
ALTER TABLE notification_inbox_state ENABLE ROW LEVEL SECURITY;
CREATE TABLE notifications(
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 source_event_id uuid NOT NULL,
 event_type varchar(64) NOT NULL CHECK(event_type IN ('booking_created','booking_paid','booking_cancelled','booking_expired','booking_completed','refund_requested','refund_confirmed','reward_claimed','reward_earned')),
 title varchar(160) NOT NULL,
 body varchar(1000) NOT NULL,
 target_route varchar(16) NOT NULL CHECK(target_route IN ('booking','rewards')),
 target_resource_id uuid,
 created_at timestamptz NOT NULL,
 read_at timestamptz,
 CONSTRAINT uq_notification_source_owner UNIQUE(source_event_id,user_id),
 CONSTRAINT fk_notification_event_owner FOREIGN KEY(source_event_id,user_id) REFERENCES outbox_events(id,user_id),
 CONSTRAINT ck_notification_target CHECK(
  (target_route='booking' AND target_resource_id IS NOT NULL AND event_type NOT IN ('reward_claimed','reward_earned')) OR
  (target_route='rewards' AND target_resource_id IS NULL AND event_type IN ('reward_claimed','reward_earned'))
 )
);
CREATE INDEX ix_notification_owner_page ON notifications(user_id,created_at DESC,id DESC);
CREATE INDEX ix_notification_unread ON notifications(user_id,created_at DESC,id DESC) WHERE read_at IS NULL;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $access$
DECLARE role_name text;
BEGIN
 EXECUTE format('REVOKE ALL ON TABLE %I.notifications,%I.notification_inbox_state FROM PUBLIC',current_schema(),current_schema());
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.notifications,%I.notification_inbox_state FROM %I',current_schema(),current_schema(),role_name);
  END IF;
 END LOOP;
END $access$;
COMMIT;
