-- Prepared only; apply after existing migrations 000-009 and 011-012 (010 is unused).
BEGIN;
SET LOCAL lock_timeout='5s';
DO $$ BEGIN
 IF current_setting('stayfinder.target_schema',true) IS DISTINCT FROM current_schema() THEN
  RAISE EXCEPTION 'Explicit target schema must match current_schema';
 END IF;
END $$;
CREATE TABLE partner_review_replies (
 review_id uuid PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE,
 partner_id uuid NOT NULL REFERENCES users(id),
 reply varchar(2000) NOT NULL CHECK(length(trim(reply))>0),
 updated_at timestamptz NOT NULL
);
ALTER TABLE partner_review_replies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE partner_review_replies FROM PUBLIC;
-- No direct-client policies; reads and writes pass through the Spring services.
COMMIT;
