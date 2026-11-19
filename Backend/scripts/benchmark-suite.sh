#!/usr/bin/env bash
set -euo pipefail
backend_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$backend_root"
test -f target/stayfinder-0.0.1-SNAPSHOT.jar
mkdir -p docs/evidence
mkdir -p target/benchmark-logs
server_pid=''
cleanup() { if [ -n "$server_pid" ]; then kill "$server_pid" 2>/dev/null || true; wait "$server_pid" 2>/dev/null || true; fi; }
trap cleanup EXIT
for mode in true false; do
  if [ "$mode" = true ]; then label=cache-on; else label=cache-off; fi
  java -Xms256m -Xmx768m -jar target/stayfinder-0.0.1-SNAPSHOT.jar \
    --spring.config.location=file:src/test/resources/application-benchmark.yaml \
    --stayfinder.cache.enabled="$mode" > "target/benchmark-logs/$label-server.log" 2>&1 &
  server_pid=$!
  python3 scripts/benchmark.py --label "$label" --clients 20 --warmup 30 --seconds 300 --rounds 3 \
    --output "docs/evidence/performance-$label.json"
  cleanup
  server_pid=''
done
