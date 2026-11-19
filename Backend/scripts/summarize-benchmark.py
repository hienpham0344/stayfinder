#!/usr/bin/env python3
"""Validate the complete paired benchmark and summarize per-round latency budgets."""
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1] / "docs" / "evidence"
WORKLOADS = {"catalog", "detail-hot", "detail-varied", "availability", "bookings", "favorite-write"}


def summarize(label):
    data = json.loads((ROOT / f"performance-{label}.json").read_text())
    assert data["clients"] == 20 and data["warmup_seconds"] == 30
    assert data["measured_seconds_per_round"] == 300
    assert len(data["rounds"]) == 3, f"Incomplete benchmark: {label}"
    assert [r["round"] for r in data["rounds"]] == [1, 2, 3]
    rows = {}
    for name in sorted(WORKLOADS):
        values = [r["latency_ms"][name] for r in data["rounds"]]
        budget = 700 if name == "favorite-write" else 300
        rows[name] = {
            "requests": sum(v["count"] for v in values),
            "p50_ms_by_round": [v["p50"] for v in values],
            "p95_ms_by_round": [v["p95"] for v in values],
            "p99_ms_by_round": [v["p99"] for v in values],
            "worst_round_p95_ms": max(v["p95"] for v in values),
            "p95_budget_ms": budget,
            "latency_budget_met": all(v["p95"] <= budget for v in values),
        }
    for r in data["rounds"]:
        assert set(r["latency_ms"]) == WORKLOADS
        if not r["error_count"]:
            assert sum(v["count"] for v in r["latency_ms"].values()) == r["requests"]
    errors = sum(r["error_count"] for r in data["rounds"])
    warmup_errors = sum(r["warmup_error_count"] for r in data["rounds"])
    metrics = [sample for r in data["rounds"] for sample in r.get("metric_samples", [])]
    return {
        "started_at_utc": data["started_at_utc"],
        "completed_at_utc": data["updated_at_utc"],
        "requests": sum(r["requests"] for r in data["rounds"]),
        "rps_by_round": [r["rps"] for r in data["rounds"]],
        "error_count": errors,
        "warmup_error_count": warmup_errors,
        "pool_observed_max": {name: max((m.get(name, 0) for m in metrics), default=0)
                              for name in ("hikaricp.connections.active", "hikaricp.connections.pending")},
        "workloads": rows,
        "passed": not errors and not warmup_errors and all(v["latency_budget_met"] for v in rows.values()),
    }


def main():
    result = {
        "scope": "Local synthetic six-workload comparison; latency percentiles stay separate per round",
        "clients": 20, "warmup_seconds_per_round": 30, "measured_seconds_per_round": 300,
        "rounds_per_mode": 3,
        "modes": {label: summarize(label) for label in ("cache-on", "cache-off")},
        "limitations": [
            "Only wishlist PUT represents writes in this workload; no latency SLA for every write API",
            "No external SePay, WAN/mobile traffic, hosted CI or production dataset",
            "Single application instance and PostgreSQL on the same local host",
            "Percentiles are per round, not pooled percentiles across rounds",
        ],
    }
    result["passed"] = all(mode["passed"] for mode in result["modes"].values())
    (ROOT / "benchmark-summary.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"passed": result["passed"], "requests": {
        key: value["requests"] for key, value in result["modes"].items()}}))
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
