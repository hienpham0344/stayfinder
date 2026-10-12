-- Read-only preflight. Set search_path and stayfinder.target_schema explicitly before running.
-- Never infer current schema from this historical/proposed application mapping.
BEGIN TRANSACTION READ ONLY;
DO $guard$
BEGIN
  IF current_setting('stayfinder.target_schema',true) IS NULL
     OR current_setting('stayfinder.target_schema',true) <> current_schema() THEN
    RAISE EXCEPTION 'Explicit preflight target schema must match current_schema';
  END IF;
END
$guard$;

SELECT current_database() AS database_name,current_schema() AS target_schema;
SELECT table_name,column_name,data_type,udt_name,is_nullable,column_default
FROM information_schema.columns
WHERE table_schema=current_schema()
  AND table_name IN ('users','auth_sessions','refresh_tokens','auth_audit_events','accommodations',
      'accommodation_type','features','accommodation_features','images','room','room_type','locations',
      'room_snapshot','accommodation_snapshot','bookings','booking_details','payments','payments_method',
      'favorites','reviews','promotions','demo_price_comparisons')
ORDER BY table_name,ordinal_position;

SELECT c.relname AS table_name,k.conname,k.contype,pg_get_constraintdef(k.oid) AS definition,
       tn.nspname AS referenced_schema,tc.relname AS referenced_table
FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_class tc ON tc.oid=k.confrelid LEFT JOIN pg_namespace tn ON tn.oid=tc.relnamespace
WHERE n.nspname=current_schema()
ORDER BY c.relname,k.conname;

SELECT tablename,indexname,indexdef FROM pg_indexes
WHERE schemaname=current_schema() ORDER BY tablename,indexname;

-- Counts only; do not emit user IDs/emails/private rows.
DO $counts$
DECLARE schema_name text:=current_schema(); total bigint; duplicates bigint; special_emails bigint; column_check record;
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=schema_name AND table_name='users' AND column_name='email') THEN
    EXECUTE format('select count(*) from %I.users',schema_name) INTO total;
    EXECUTE format('select count(*) from (select lower(btrim(email)) from %I.users where email is not null group by lower(btrim(email)) having count(*)>1) duplicate_groups',schema_name) INTO duplicates;
    EXECUTE format('select count(*) from %I.users where email ~ ''[^ -~]'' or email<>btrim(email)',schema_name) INTO special_emails;
    RAISE NOTICE 'users rows=%, normalized duplicate groups=%, emails requiring Java Locale.ROOT/whitespace review=%',total,duplicates,special_emails;
  END IF;
  FOR column_check IN SELECT * FROM (VALUES
      ('room','nightly_price_cents'),('room_snapshot','source_room_id'),
      ('accommodation_snapshot','source_accommodation_id'),('bookings','hold_expires_at')) AS requested(table_name,column_name)
  LOOP
    IF EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema=schema_name AND c.table_name=column_check.table_name AND c.column_name=column_check.column_name) THEN
      EXECUTE format('select count(*) from %I.%I where %I is null',schema_name,column_check.table_name,column_check.column_name) INTO total;
      RAISE NOTICE 'unclassified null %.% rows=%',column_check.table_name,column_check.column_name,total;
    ELSE
      RAISE NOTICE 'mapping absent %.%',column_check.table_name,column_check.column_name;
    END IF;
  END LOOP;
END
$counts$;
COMMIT;
