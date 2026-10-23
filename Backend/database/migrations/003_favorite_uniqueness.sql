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

DO $favorites$
BEGIN
 IF EXISTS(SELECT 1 FROM favorites WHERE user_id IS NULL OR accommodation_id IS NULL) THEN RAISE EXCEPTION 'Unowned favorites require reviewed remediation'; END IF;
 IF EXISTS(SELECT 1 FROM favorites GROUP BY user_id,accommodation_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Duplicate favorites require reviewed remediation'; END IF;
END
$favorites$;
ALTER TABLE favorites ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE favorites ALTER COLUMN accommodation_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_favorites_owner_stay ON favorites(user_id,accommodation_id);

COMMIT;
