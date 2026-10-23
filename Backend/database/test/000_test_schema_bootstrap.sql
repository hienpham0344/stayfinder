-- G2 draft: creates ONLY stayfinder_test_20261013; refuses an existing schema.
-- No public DDL/data mutation and no source rows are copied.
-- Caller must SET stayfinder.target_schema='stayfinder_test_20261013'.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $bootstrap$
DECLARE
 target text:=current_setting('stayfinder.target_schema',true);
 t text; fk record; definition text; role_name text;
 baseline text[]:=ARRAY['users','accommodation_type','accommodations','features','accommodation_features','images','room_type','room','promotions','room_snapshot','accommodation_snapshot','bookings','booking_details','payments_method','payments','favorites','reviews','loyalty_points_history','reports'];
BEGIN
 IF target IS DISTINCT FROM 'stayfinder_test_20261013' THEN RAISE EXCEPTION 'Exact disposable target required'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace WHERE nspname=target) THEN RAISE EXCEPTION 'Test schema already exists; no reset or drop is authorized'; END IF;
 EXECUTE format('CREATE SCHEMA %I',target);
 EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC',target);
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN EXECUTE format('REVOKE ALL ON SCHEMA %I FROM %I',target,role_name); END IF;
 END LOOP;
 -- Exclude defaults/triggers/policies/data so no source sequence/function is invoked.
 FOREACH t IN ARRAY baseline LOOP
  IF to_regclass(format('public.%I',t)) IS NULL THEN RAISE EXCEPTION 'Observed baseline table missing: %',t; END IF;
  EXECUTE format('CREATE TABLE %I.%I (LIKE public.%I INCLUDING CONSTRAINTS INCLUDING INDEXES)',target,t,t);
  EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',target,t);
 END LOOP;
 PERFORM set_config('search_path',quote_ident(target)||',pg_catalog',true);
 FOR fk IN
  SELECT c.relname AS table_name,k.conname,k.oid,tn.nspname AS referenced_schema,tc.relname AS referenced_table
  FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN pg_class tc ON tc.oid=k.confrelid JOIN pg_namespace tn ON tn.oid=tc.relnamespace
  WHERE n.nspname='public' AND k.contype='f' AND c.relname=ANY(baseline)
 LOOP
  -- The test copy uses Spring-owned UUIDs. The public FK remains untouched.
  IF fk.table_name='users' AND fk.conname='users_id_fkey' AND fk.referenced_schema='auth' AND fk.referenced_table='users' THEN CONTINUE; END IF;
  IF fk.referenced_schema<>'public' OR NOT fk.referenced_table=ANY(baseline) THEN RAISE EXCEPTION 'Unreviewed external FK: %',fk.conname; END IF;
  definition:=replace(pg_get_constraintdef(fk.oid),'REFERENCES public.',format('REFERENCES %I.',target));
  EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',target,fk.table_name,fk.conname,definition);
 END LOOP;
END
$bootstrap$;
COMMIT;
