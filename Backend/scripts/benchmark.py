#!/usr/bin/env python3
"""Local synthetic benchmark. Never use against a deployment containing real data."""
import argparse
import base64
import concurrent.futures
import datetime
import hashlib
import hmac
import http.client
import json
import os
import platform
import time
import threading
import uuid

KEY = base64.b64decode('c3RheWZpbmRlci10ZXN0LXNlY3JldC13aXRoLWF0LWxlYXN0LTI1Ni1iaXRzLTEyMzQ1Ng==')

def identifier(text):
    return str(uuid.UUID(hashlib.md5(text.encode()).hexdigest()))

def token(user):
    def enc(value):
        return base64.urlsafe_b64encode(value).decode().rstrip('=')
    now = int(time.time())
    head = enc(b'{"alg":"HS256","typ":"JWT"}')
    body = enc(json.dumps({'sub': user, 'iat': now, 'exp': now + 86400, 'auth_version': 0}).encode())
    value = head + '.' + body
    return value + '.' + enc(hmac.new(KEY, value.encode(), hashlib.sha256).digest())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=58091)
    parser.add_argument('--seconds', type=int, default=300)
    parser.add_argument('--warmup', type=int, default=30)
    parser.add_argument('--clients', type=int, default=20)
    parser.add_argument('--rounds', type=int, default=3)
    parser.add_argument('--output', required=True)
    parser.add_argument('--label', default='current-cache-on')
    args = parser.parse_args()
    started_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    # A public fixture key is deliberately used, and only localhost is addressable.
    results = []
    checkout = datetime.date.today() + datetime.timedelta(days=60)
    deadline = time.monotonic() + 60
    while True:
        connection = http.client.HTTPConnection('127.0.0.1', args.port, timeout=3)
        try:
            connection.request('GET', '/actuator/health')
            response = connection.getresponse()
            if response.status == 200 and json.loads(response.read()).get('status') == 'UP': break
        except (OSError, http.client.HTTPException, ValueError): pass
        finally: connection.close()
        if time.monotonic() >= deadline: raise SystemExit('Benchmark server did not become ready')
        time.sleep(1)

    def phase(duration, record):
        stop = time.monotonic() + duration
        metric_samples = []
        finished = threading.Event()
        def monitor():
            auth = token(identifier('admin'))
            while not finished.is_set():
                sample = {}
                for name in ['hikaricp.connections.active', 'hikaricp.connections.pending', 'cache.gets']:
                    connection = http.client.HTTPConnection('127.0.0.1', args.port, timeout=3)
                    try:
                        connection.request('GET', '/actuator/metrics/' + name, headers={'Authorization': 'Bearer ' + auth})
                        response = connection.getresponse()
                        body = json.loads(response.read())
                        if response.status == 200:
                            sample[name] = sum(m['value'] for m in body.get('measurements', []))
                    except (OSError, http.client.HTTPException, ValueError): pass
                    finally: connection.close()
                if sample: metric_samples.append(sample)
                finished.wait(5)
        observer = threading.Thread(target=monitor, daemon=True)
        observer.start()
        def worker(index):
            conn = http.client.HTTPConnection('127.0.0.1', args.port, timeout=20)
            auth = token(identifier('customer-' + str(index + 1)))
            samples, errors = [], []
            count = 0
            while time.monotonic() < stop:
                item = count % 6
                stay = identifier('stay-' + str(1 + (index * 17 + count) % 1000))
                if item == 0:
                    route, kind = '/api/accommodations?page=0&size=20', 'catalog'
                elif item == 1:
                    route, kind = '/api/accommodations/' + identifier('stay-1'), 'detail-hot'
                elif item == 2:
                    route, kind = '/api/accommodations/' + stay + '/rooms?checkIn=' + checkout.isoformat() + '&checkOut=' + (checkout + datetime.timedelta(days=2)).isoformat() + '&guests=2', 'availability'
                elif item == 3:
                    route, kind = '/api/bookings?page=0&size=20', 'bookings'
                elif item == 4:
                    route, kind = '/api/favorites/' + stay, 'favorite-write'
                else:
                    route, kind = '/api/accommodations/' + stay, 'detail-varied'
                started = time.monotonic()
                try:
                    conn.request('PUT' if item == 4 else 'GET', route, headers={'Authorization': 'Bearer ' + auth})
                    response = conn.getresponse()
                    payload = response.read()
                    elapsed = (time.monotonic() - started) * 1000
                    if response.status != 200:
                        errors.append({'status': response.status, 'kind': kind})
                    else:
                        body = json.loads(payload)
                        if body.get('code') != 'SUCCESS': errors.append({'status': 'contract', 'kind': kind})
                    if record: samples.append((kind, elapsed))
                except (OSError, http.client.HTTPException, ValueError) as error:
                    errors.append({'status': type(error).__name__, 'kind': kind})
                    conn.close()
                    conn = http.client.HTTPConnection('127.0.0.1', args.port, timeout=20)
                count += 1
            conn.close()
            return samples, errors, count
        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=args.clients) as pool:
                values = list(pool.map(worker, range(args.clients)))
        finally:
            finished.set()
            observer.join(timeout=12)
        return values, metric_samples

    for round_number in range(1, args.rounds + 1):
        warmup, _ = phase(args.warmup, False)
        measured, metric_samples = phase(args.seconds, True)
        samples = [s for rows, _, _ in measured for s in rows]
        errors = [e for _, rows, _ in measured for e in rows]
        groups = {}
        for kind, elapsed in samples: groups.setdefault(kind, []).append(elapsed)
        summary = {}
        for kind, values in groups.items():
            values.sort()
            summary[kind] = {'count': len(values), **{
                'p' + str(p): round(values[min(len(values) - 1, int((len(values) - 1) * p / 100))], 2)
                for p in [50, 95, 99]}}
        results.append({'round': round_number, 'requests': sum(n for _, _, n in measured),
                        'rps': round(sum(n for _, _, n in measured) / args.seconds, 2),
                        'errors': errors[:20], 'error_count': len(errors),
                        'warmup_error_count': sum(len(e) for _, e, _ in warmup), 'latency_ms': summary,
                        'metric_samples': metric_samples})
        output = {'label': args.label, 'clients': args.clients, 'warmup_seconds': args.warmup,
                  'measured_seconds_per_round': args.seconds, 'cpu_count': os.cpu_count(),
                  'platform': platform.platform(), 'started_at_utc': started_at,
                  'updated_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'rounds': results}
        with open(args.output, 'w') as handle: json.dump(output, handle, indent=2)
        print(json.dumps(results[-1]), flush=True)
    if any(r['error_count'] or r['warmup_error_count'] for r in results): raise SystemExit(1)

if __name__ == '__main__': main()
