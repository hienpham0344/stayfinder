-- DRAFT, NOT APPLIED. New G2 approval required; public rollout remains separate.
-- No data backfill/deletion, provider action or seed. Refuse incompatible historical rows.
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
 IF EXISTS(SELECT 1 FROM reviews WHERE user_id IS NULL OR booking_id IS NULL OR accommodation_id IS NULL
           OR rating IS NULL OR rating NOT BETWEEN 1 AND 5 OR created_at IS NULL OR length(comment)>2000) THEN
  RAISE EXCEPTION 'Historical reviews require an explicitly reviewed remediation; no automatic rewrite';
 END IF;
 IF EXISTS(SELECT 1 FROM reviews GROUP BY booking_id,user_id HAVING count(*)>1) THEN
  RAISE EXCEPTION 'Duplicate reviews require explicit remediation';
 END IF;
END
$scope$;
ALTER TABLE reviews ADD COLUMN updated_at timestamptz;
ALTER TABLE reviews ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN booking_id SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN accommodation_id SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN rating SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE reviews ADD CONSTRAINT ck_review_rating CHECK(rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD CONSTRAINT ck_review_comment CHECK(comment IS NULL OR length(comment)<=2000);
ALTER TABLE reviews ADD CONSTRAINT uq_review_booking_owner UNIQUE(booking_id,user_id);
ALTER TABLE reviews ADD CONSTRAINT uq_review_id_owner UNIQUE(id,user_id);
ALTER TABLE reviews ADD CONSTRAINT fk_review_booking_owner FOREIGN KEY(booking_id,user_id) REFERENCES bookings(id,user_id);
CREATE INDEX ix_review_stay_page ON reviews(accommodation_id,created_at DESC,id DESC);
CREATE TABLE media_assets(
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES users(id),
 review_id uuid,
 mime_type varchar(32) NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
 size_bytes bigint NOT NULL CHECK(size_bytes BETWEEN 1 AND 5242880),
 created_at timestamptz NOT NULL,
 unattached_since timestamptz,
 CONSTRAINT fk_media_review_owner FOREIGN KEY(review_id,user_id) REFERENCES reviews(id,user_id),
 CONSTRAINT ck_media_attachment_state CHECK(
  (review_id IS NULL AND unattached_since IS NOT NULL) OR
  (review_id IS NOT NULL AND unattached_since IS NULL)
 )
);
CREATE INDEX ix_media_review ON media_assets(review_id,created_at,id);
CREATE INDEX ix_media_unattached_cleanup ON media_assets(unattached_since,id) WHERE review_id IS NULL;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DO $access$
DECLARE role_name text;
BEGIN
 EXECUTE format('REVOKE ALL ON TABLE %I.media_assets,%I.reviews FROM PUBLIC',current_schema(),current_schema());
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
   EXECUTE format('REVOKE ALL ON TABLE %I.media_assets,%I.reviews FROM %I',current_schema(),current_schema(),role_name);
  END IF;
 END LOOP;
END
$access$;
COMMIT;
