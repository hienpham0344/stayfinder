#!/usr/bin/env bash
set -euo pipefail
# Only a disposable local database with this exact name is accepted.
export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-55439}"
export PGUSER="${PGUSER:-stayfinder_test}"
export PGDATABASE=stayfinder_test
case "$PGHOST" in 127.0.0.1|localhost) ;; *) echo 'Only local test PostgreSQL is permitted' >&2; exit 1;; esac
backend_root="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$(psql -X -Atqc 'select current_database()')" != stayfinder_test ]; then exit 1; fi
if [ "$(psql -X -Atqc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'")" = 0 ]; then
  for migration in "$backend_root"/db/migrations/*.sql; do
    psql -X -v ON_ERROR_STOP=1 -f "$migration"
  done
else
  echo 'Test schema already exists; migrations are not reapplied automatically.'
fi
export STAYFINDER_TEST_DATABASE_URL="jdbc:postgresql://$PGHOST:$PGPORT/stayfinder_test"
export STAYFINDER_TEST_DATABASE_USER="$PGUSER"
export STAYFINDER_TEST_DATABASE_PASSWORD="${PGPASSWORD:-}"
cd "$backend_root"
bash ./mvnw -Dstayfinder.integration=true verify "$@"
