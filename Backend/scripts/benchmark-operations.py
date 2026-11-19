#!/usr/bin/env python3
"""Local synthetic ADMIN/PARTNER and unpaid booking/payment HTTP benchmark.

Uses only public fixture identities and 127.0.0.1. It never sends a webhook or
real payment, and retains the synthetic cancelled bookings/payment history.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
import http.client
import json
import math
import os
from pathlib import Path
import platform
import threading
import time
from benchmark import identifier, token


READS = [
    ("admin-statistics", "/api/admin/statistics", "admin", "statistics"),
    ("partner-statistics", "/api/partner/statistics", "partner", "statistics"),
    ("admin-bookings", "/api/admin/bookings?page=0&size=20", "admin", "page"),
    ("partner-bookings", "/api/partner/bookings?page=0&size=20", "partner", "page"),
    ("admin-payments", "/api/admin/payments?page=0&size=20", "admin", "page"),
    ("partner-payments", "/api/partner/payments?page=0&size=20", "partner", "page"),
]


def contract(result, kind):
    if not isinstance(result, dict):
        return False
    if kind == "statistics":
        return all(isinstance(result.get(k), (int, float)) and result[k] >= 0 for k in (
            "totalBookings", "pendingBookings", "cancelledBookings", "completedBookings", "receivedRevenue"))
    if kind == "page":
        return (isinstance(result.get("content"), list) and len(result["content"]) <= 20
                and isinstance(result.get("totalElements"), int)
                and result["totalElements"] >= len(result["content"]))
    return True


def confidence_interval(successes, count):
    # Wilson 95% interval for the under-budget fraction, conditional on IID samples.
    # Requests in a closed-loop load test are correlated; this is descriptive,
    # not a claim of a production SLA or independent percentile confidence.
    z = 1.959963984540054
    proportion = successes / count
    denominator = 1 + z * z / count
    center = (proportion + z * z / (2 * count)) / denominator
    margin = z * math.sqrt(proportion * (1 - proportion) / count + z * z / (4 * count * count)) / denominator
    return [round(max(0, center - margin), 6), round(min(1, center + margin), 6)]


def summarize(values, budget):
    values.sort()
    return {"count": len(values), **{
        "p" + str(p): round(values[min(len(values) - 1, int((len(values) - 1) * p / 100))], 2)
        for p in (50, 95, 99)}, "budget_ms": budget,
        "fraction_within_budget": round(sum(v <= budget for v in values) / len(values), 6),
        "within_budget_wilson95_iid": confidence_interval(sum(v <= budget for v in values), len(values))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=58091)
    parser.add_argument("--clients", type=int, default=20)
    parser.add_argument("--warmup", type=int, default=30)
    parser.add_argument("--seconds", type=int, default=300)
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not 1 <= args.clients <= 20 or min(args.warmup, args.seconds, args.rounds) < 1:
        parser.error("Use 1–20 fixture clients and positive phase durations/round count")
    started_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    credentials = {name: token(identifier(name)) for name in ("admin", "partner")}

    def check(route, actor):
        connection = http.client.HTTPConnection("127.0.0.1", args.port, timeout=30)
        try:
            connection.request("GET", route, headers={"Authorization": "Bearer " + credentials[actor]})
            response = connection.getresponse()
            body = json.loads(response.read())
            if response.status != 200 or body.get("code") != "SUCCESS":
                raise SystemExit("Fixture preflight failed; HTTP " + str(response.status))
            return body["result"]
        finally:
            connection.close()

    # Fail closed before writes if the backend does not recognize the known fixture.
    account = check("/api/admin/users/" + identifier("admin"), "admin")
    if account.get("email") != "admin@example.test" or account.get("role") != "ADMIN":
        raise SystemExit("Refusing benchmark outside the public synthetic fixture")
    property_view = check("/api/partner/accommodations/" + identifier("stay-1"), "partner")
    if property_view.get("accommodation", {}).get("partnerId") != identifier("partner"):
        raise SystemExit("Synthetic property owner mismatch")
    initial = check("/api/admin/statistics", "admin")
    if initial["totalBookings"] < 100000:
        raise SystemExit("Expected the 100000-booking synthetic baseline")
    initial_payments = check("/api/admin/payments?page=0&size=20", "admin")["totalElements"]
    today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).date()
    # Counters persist through warm-up and all rounds; no same-room/date iteration repeats.
    sequences = [0] * args.clients
    results = []
    generated_bookings = generated_payments = cancelled_bookings = 0

    def phase(duration, record):
        stop = time.monotonic() + duration
        finished = threading.Event()
        metrics = []

        def monitor():
            while not finished.is_set():
                sample = {}
                for name in ("hikaricp.connections.active", "hikaricp.connections.pending", "hikaricp.connections.max"):
                    connection = http.client.HTTPConnection("127.0.0.1", args.port, timeout=3)
                    try:
                        connection.request("GET", "/actuator/metrics/" + name,
                                           headers={"Authorization": "Bearer " + credentials["admin"]})
                        response = connection.getresponse()
                        body = json.loads(response.read())
                        if response.status == 200:
                            sample[name] = sum(m["value"] for m in body.get("measurements", []))
                    except (OSError, http.client.HTTPException, ValueError):
                        pass
                    finally:
                        connection.close()
                if sample:
                    metrics.append(sample)
                finished.wait(5)

        def worker(index):
            connection = http.client.HTTPConnection("127.0.0.1", args.port, timeout=30)
            customer = token(identifier("customer-" + str(index + 1)))
            samples, errors = [], []
            requests = created = paid = cancelled = 0

            def request(method, route, auth, kind, payload=None, expected=None):
                nonlocal connection, requests
                headers = {"Authorization": "Bearer " + auth}
                body = None if payload is None else json.dumps(payload)
                if body is not None:
                    headers["Content-Type"] = "application/json"
                started = time.monotonic()
                result = None
                try:
                    connection.request(method, route, body=body, headers=headers)
                    response = connection.getresponse()
                    content = json.loads(response.read())
                    if response.status != 200 or content.get("code") != "SUCCESS":
                        errors.append({"kind": kind, "status": response.status})
                    else:
                        result = content.get("result")
                        if expected is not None and not expected(result):
                            errors.append({"kind": kind, "status": "contract"})
                except (OSError, http.client.HTTPException, ValueError):
                    errors.append({"kind": kind, "status": "transport_or_json"})
                    connection.close()
                    connection = http.client.HTTPConnection("127.0.0.1", args.port, timeout=30)
                finally:
                    requests += 1
                    if record:
                        samples.append((kind, (time.monotonic() - started) * 1000))
                return result

            iteration = index
            while time.monotonic() < stop:
                item = iteration % 7
                if item < len(READS):
                    kind, route, actor, shape = READS[item]
                    request("GET", route, credentials[actor], kind, expected=lambda r: contract(r, shape))
                else:
                    check_in = today + datetime.timedelta(days=60 + sequences[index] * 3)
                    sequences[index] += 1
                    payload = {"accommodationId": identifier("stay-" + str(index + 1)),
                               "roomId": identifier("room-" + str(index * 10 + 1)),
                               "checkIn": check_in.isoformat(),
                               "checkOut": (check_in + datetime.timedelta(days=2)).isoformat(),
                               "quantity": 1, "guests": 2}
                    booking = request("POST", "/api/bookings", customer, "booking-create", payload,
                                      lambda r: isinstance(r, dict) and bool(r.get("id"))
                                      and r.get("status") == "PENDING" and r.get("totalPrice") == 220000)
                    if isinstance(booking, dict) and booking.get("id"):
                        created += 1
                        booking_id = booking["id"]
                        payment = request("POST", "/api/bookings/" + booking_id + "/payments", customer, "payment-create",
                                          expected=lambda r: isinstance(r, dict) and r.get("bookingId") == booking_id
                                          and r.get("status") == "PENDING" and r.get("amount") == 220000 and bool(r.get("paymentCode")))
                        if isinstance(payment, dict) and payment.get("id"):
                            paid += 1
                        cancellation = request("POST", "/api/bookings/" + booking_id + "/cancel", customer, "booking-cancel",
                                               expected=lambda r: isinstance(r, dict) and r.get("id") == booking_id
                                               and r.get("status") == "CANCELLED")
                        if isinstance(cancellation, dict) and cancellation.get("status") == "CANCELLED":
                            cancelled += 1
                iteration += 1
            connection.close()
            return samples, errors, requests, created, paid, cancelled

        observer = threading.Thread(target=monitor, daemon=True)
        observer.start()
        started = time.monotonic()
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=args.clients) as executor:
                values = list(executor.map(worker, range(args.clients)))
        finally:
            finished.set()
            observer.join(timeout=12)
        return values, metrics, time.monotonic() - started

    for round_number in range(1, args.rounds + 1):
        warmup, _, _ = phase(args.warmup, False)
        measured, metrics, elapsed = phase(args.seconds, True)
        phases = warmup + measured
        generated_bookings += sum(v[3] for v in phases)
        generated_payments += sum(v[4] for v in phases)
        cancelled_bookings += sum(v[5] for v in phases)
        groups = {}
        for values, *_ in measured:
            for kind, latency in values:
                groups.setdefault(kind, []).append(latency)
        latency = {kind: summarize(values, 700 if kind in {"booking-create", "payment-create", "booking-cancel"} else 300)
                   for kind, values in sorted(groups.items())}
        errors = [e for v in measured for e in v[1]]
        row = {"round": round_number, "requests": sum(v[2] for v in measured),
               "rps": round(sum(v[2] for v in measured) / elapsed, 2), "actual_elapsed_seconds": round(elapsed, 3),
               "error_count": len(errors), "errors": errors[:20],
               "warmup_error_count": sum(len(v[1]) for v in warmup), "latency_ms": latency,
               "metric_samples": metrics, "latency_budget_met": all(v["p95"] <= v["budget_ms"] for v in latency.values())}
        results.append(row)
        after = check("/api/admin/statistics", "admin")
        after_payments = check("/api/admin/payments?page=0&size=20", "admin")["totalElements"]
        jar = Path(__file__).resolve().parents[1] / "target/stayfinder-0.0.1-SNAPSHOT.jar"
        output = {"clients": args.clients, "warmup_seconds": args.warmup, "measured_seconds_per_round": args.seconds,
                  "started_at_utc": started_at, "updated_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  "cpu_count": os.cpu_count(), "platform": platform.platform(),
                  "artifact_sha256": hashlib.sha256(jar.read_bytes()).hexdigest() if jar.exists() else None,
                  "initial_statistics": initial, "final_statistics": after,
                  "dataset_effect": {"generated_bookings_including_warmup": generated_bookings,
                                     "generated_payments_including_warmup": generated_payments,
                                     "cancelled_bookings_including_warmup": cancelled_bookings,
                                     "booking_count_delta": after["totalBookings"] - initial["totalBookings"],
                                     "payment_count_delta": after_payments - initial_payments,
                                     "history_deleted": False},
                  "rounds": results, "passed": all(not r["error_count"] and not r["warmup_error_count"]
                                                    and r["latency_budget_met"] for r in results),
                  "limitations": ["Local synthetic fixture; no production/WAN SLA", "No real transfer or SePay webhook",
                                  "Workload adds retained cancelled bookings and pending payment history",
                                  "Wilson intervals are descriptive and assume IID; closed-loop samples are correlated"]}
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_suffix(args.output.suffix + ".tmp")
        temporary.write_text(json.dumps(output, indent=2) + "\n")
        temporary.replace(args.output)
        print(json.dumps({k: row[k] for k in ("round", "requests", "rps", "error_count", "warmup_error_count", "latency_budget_met")}), flush=True)
    return 0 if output["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
