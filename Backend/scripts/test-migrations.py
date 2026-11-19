#!/usr/bin/env python3
"""Exercise SQL migrations on a marked disposable local PostgreSQL database only."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
DATABASE = "stayfinder_migration_test"
MARKER = "StayFinder disposable migration regression database v1"
LEGACY = "00000000-0000-0000-0000-000000000001"
EARNED = "00000000-0000-0000-0000-000000000002"
BOOKING = "00000000-0000-0000-0000-000000000003"


class Postgres:
    def __init__(self, directory):
        self.psql = str(Path(directory) / "psql") if directory else shutil.which("psql")
        if not self.psql or not Path(self.psql).is_file():
            raise RuntimeError("psql is required; set --psql-dir or PATH")
        self.host = os.environ.get("PGHOST", "127.0.0.1")
        if self.host not in {"127.0.0.1", "localhost"}:
            raise RuntimeError("Only a local disposable PostgreSQL server is permitted")
        self.port = str(int(os.environ.get("PGPORT", "55439")))
        self.user = os.environ.get("PGUSER", "stayfinder_test")
        self.env = dict(os.environ)
        for key in ("PGSERVICE", "PGSERVICEFILE", "PGOPTIONS"):
            self.env.pop(key, None)

    def sql(self, statement, database=DATABASE, expect_success=True):
        if database not in {DATABASE, "postgres"}:
            raise RuntimeError("Refusing unexpected database")
        command = [self.psql, "-X", "-w", "-h", self.host, "-p", self.port,
                   "-U", self.user, "-d", database, "-A", "-t", "-q", "-v", "ON_ERROR_STOP=1"]
        result = subprocess.run(command, input=statement, text=True, capture_output=True,
                                env=self.env, timeout=60)
        if expect_success and result.returncode:
            raise RuntimeError("PostgreSQL test command failed: " + result.stderr.strip()[-1000:])
        return result

    def scalar(self, statement):
        return self.sql(statement).stdout.strip()

    def prepare_database(self):
        exists = self.sql("SELECT count(*) FROM pg_database WHERE datname='" + DATABASE + "';",
                          "postgres").stdout.strip()
        if exists == "0":
            self.sql("CREATE DATABASE " + DATABASE + ";", "postgres")
            self.sql("COMMENT ON DATABASE " + DATABASE + " IS '" + MARKER + "';", "postgres")
        marker = self.sql("SELECT coalesce(shobj_description(oid,'pg_database'),'') "
                          "FROM pg_database WHERE datname='" + DATABASE + "';", "postgres").stdout.strip()
        if marker != MARKER:
            raise RuntimeError("Existing database lacks the regression marker; refusing to reset it")

    def reset(self):
        # Both database name and opt-in marker must match before deleting test-only objects.
        self.sql("DO $$ BEGIN IF current_database()<>'" + DATABASE + "' OR "
                 "(SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database()) "
                 "IS DISTINCT FROM '" + MARKER + "' THEN RAISE EXCEPTION 'Wrong regression target'; END IF; END $$; "
                 "DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        self.migrate("000_baseline.sql")
        self.migrate("001_public_local_auth_integrity.sql")

    def migrate(self, filename, expect_success=True):
        return self.sql((ROOT / "db" / "migrations" / filename).read_text(), expect_success=expect_success)


class MigrationTests(unittest.TestCase):
    pg = None

    def setUp(self):
        self.pg.reset()

    def add_user(self, identifier, points):
        self.pg.sql("INSERT INTO users(id,full_name,email,role,loyalty_points) VALUES('" + identifier
                    + "','Migration fixture','" + identifier + "@example.test','customer'," + str(points) + ");")

    def earned_user(self, points=250):
        self.add_user(EARNED, points)
        self.pg.sql("INSERT INTO reward_ledger(id,user_id,delta,balance_after,source_type,source_id,idempotency_key,created_at) "
                    "VALUES(gen_random_uuid(),'" + EARNED + "',250,250,'COMPLETED','" + BOOKING
                    + "','COMPLETED:migration-fixture',CURRENT_TIMESTAMP);")

    def test_replay_does_not_duplicate_an_earned_balance(self):
        self.pg.migrate("002_backend_capabilities.sql")
        self.earned_user()
        self.pg.migrate("002_backend_capabilities.sql")
        self.assertEqual("250", self.pg.scalar("SELECT sum(delta) FROM reward_ledger WHERE user_id='" + EARNED + "';"))
        self.assertEqual("1", self.pg.scalar("SELECT count(*) FROM reward_ledger WHERE user_id='" + EARNED + "';"))
        self.assertEqual("250", self.pg.scalar("SELECT loyalty_points FROM users WHERE id='" + EARNED + "';"))

    def test_legacy_balance_is_preserved_once(self):
        self.add_user(LEGACY, 1234)
        self.pg.migrate("002_backend_capabilities.sql")
        self.pg.migrate("002_backend_capabilities.sql")
        self.pg.migrate("003_operations_pagination.sql")
        self.assertEqual("1234|1234|1234|1", self.pg.scalar("SELECT u.loyalty_points,sum(l.delta),max(l.balance_after),count(l.id) "
                         "FROM users u JOIN reward_ledger l ON l.user_id=u.id WHERE u.id='" + LEGACY + "' GROUP BY u.id;"))
        self.assertEqual("1", self.pg.scalar("SELECT count(*) FROM reward_catalog;"))

    def test_negative_balance_rolls_back(self):
        self.add_user(LEGACY, -1)
        result = self.pg.migrate("002_backend_capabilities.sql", expect_success=False)
        self.assertNotEqual(0, result.returncode)
        self.assertIn("Reconcile negative", result.stderr)
        self.assertEqual("-1", self.pg.scalar("SELECT loyalty_points FROM users WHERE id='" + LEGACY + "';"))
        self.assertEqual("0", self.pg.scalar("SELECT count(*) FROM information_schema.columns WHERE table_name='users' AND column_name='enabled';"))
        self.assertEqual("", self.pg.scalar("SELECT to_regclass('public.reward_ledger');"))

    def test_pending_expiry_and_snapshot_are_backfilled_once(self):
        self.add_user(LEGACY, 0)
        self.pg.sql("INSERT INTO bookings(id,user_id,total_price,status,created_at) VALUES('" + BOOKING + "','"
                    + LEGACY + "',200000,'pending','2026-01-02T03:00:00Z');")
        self.pg.migrate("002_backend_capabilities.sql")
        self.pg.migrate("002_backend_capabilities.sql")
        self.assertEqual("200000|900|0", self.pg.scalar("SELECT subtotal,extract(epoch FROM expires_at-created_at)::int,discount_amount "
                                                       "FROM bookings WHERE id='" + BOOKING + "';"))

    def test_pending_unknown_creation_rolls_back(self):
        self.add_user(LEGACY, 0)
        self.pg.sql("INSERT INTO bookings(id,user_id,total_price,status) VALUES('" + BOOKING + "','" + LEGACY + "',200000,'pending');")
        result = self.pg.migrate("002_backend_capabilities.sql", expect_success=False)
        self.assertNotEqual(0, result.returncode)
        self.assertIn("unknown creation time", result.stderr)
        self.assertEqual("1", self.pg.scalar("SELECT count(*) FROM bookings WHERE created_at IS NULL;"))
        self.assertEqual("0", self.pg.scalar("SELECT count(*) FROM information_schema.columns WHERE table_name='bookings' AND column_name='expires_at';"))

    def test_existing_ledger_mismatch_fails_without_rewriting_history(self):
        self.pg.migrate("002_backend_capabilities.sql")
        self.earned_user(points=500)
        self.pg.sql("INSERT INTO bookings(id,user_id,total_price,status,created_at,subtotal) VALUES('" + BOOKING + "','"
                    + EARNED + "',200000,'pending','2026-01-02T03:00:00Z',NULL);")
        result = self.pg.migrate("002_backend_capabilities.sql", expect_success=False)
        self.assertNotEqual(0, result.returncode)
        self.assertIn("Reconcile reward ledger", result.stderr)
        self.assertEqual("250|1", self.pg.scalar("SELECT sum(delta),count(*) FROM reward_ledger WHERE user_id='" + EARNED + "';"))
        self.assertEqual("500", self.pg.scalar("SELECT loyalty_points FROM users WHERE id='" + EARNED + "';"))
        self.assertEqual("1", self.pg.scalar("SELECT count(*) FROM bookings WHERE subtotal IS NULL;"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--psql-dir", help="Directory containing an existing PostgreSQL psql executable")
    parser.add_argument("--test", help="Run one test method, e.g. test_replay_does_not_duplicate_an_earned_balance")
    parser.add_argument("--output", type=Path, default=ROOT / "docs/evidence/migrations.json")
    args = parser.parse_args()
    pg = Postgres(args.psql_dir)
    pg.prepare_database()
    MigrationTests.pg = pg
    suite = unittest.defaultTestLoader.loadTestsFromName(args.test, MigrationTests) if args.test else unittest.defaultTestLoader.loadTestsFromTestCase(MigrationTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    evidence = {"database": DATABASE, "postgresql": pg.scalar("SHOW server_version;"),
                "observed_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "tests": result.testsRun, "failures": len(result.failures), "errors": len(result.errors),
                "skipped": len(result.skipped), "successful": result.wasSuccessful(),
                "cases": [name for name in unittest.defaultTestLoader.getTestCaseNames(MigrationTests) if not args.test or name == args.test],
                "scope": "Fresh and legacy synthetic data; only marked local stayfinder_migration_test is reset"}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(evidence, indent=2) + "\n")
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
