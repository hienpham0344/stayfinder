-- Run only on the synthetic stayfinder_benchmark_test database.
DO $$ BEGIN IF current_database()<>'stayfinder_benchmark_test' THEN RAISE EXCEPTION 'Wrong database'; END IF; END $$;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT * FROM bookings WHERE user_id=md5('customer-1')::uuid ORDER BY created_at DESC,id DESC LIMIT 20;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT DISTINCT s.room_id FROM booking_details d JOIN room_snapshot s ON s.id=d.room_snapshot_id JOIN bookings b ON b.id=d.booking_id
 WHERE s.room_id IN(SELECT id FROM room WHERE accommodation_id=md5('stay-1')::uuid)
 AND d.check_in_date<CURRENT_DATE+62 AND d.check_out_date>CURRENT_DATE+60
 AND (b.status='confirmed' OR (b.status='pending' AND b.expires_at>now()));
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT a.id,matched.id,matched.price FROM accommodations a JOIN LATERAL(
 SELECT r.id,r.price FROM room r WHERE r.accommodation_id=a.id AND r.status='available' AND r.capacity>=2
 ORDER BY r.price,r.id LIMIT 1) matched ON true WHERE a.status='active' ORDER BY a.created_at DESC,a.id DESC LIMIT 20;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT b.* FROM bookings b WHERE EXISTS(SELECT 1 FROM booking_details d JOIN accommodation_snapshot s ON s.id=d.accommodation_snapshot_id
 JOIN accommodations a ON a.id=s.accommodation_id WHERE d.booking_id=b.id AND a.partner_id=md5('partner')::uuid)
 ORDER BY b.created_at DESC,b.id DESC LIMIT 20;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT count(*),sum(CASE WHEN status='pending' THEN 1 ELSE 0 END),sum(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) FROM bookings;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT sum(amount) FROM payments WHERE status='success';
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT * FROM reward_ledger WHERE user_id=md5('customer-1')::uuid ORDER BY created_at DESC,id DESC LIMIT 20;
EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON)
 SELECT * FROM users WHERE lower(btrim(email))=lower(btrim('1@example.test'));
