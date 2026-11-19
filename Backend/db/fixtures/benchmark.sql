-- Only for a fresh, disposable database named stayfinder_benchmark_test.
DO $$ BEGIN
 IF current_database() <> 'stayfinder_benchmark_test' THEN RAISE EXCEPTION 'Wrong benchmark database'; END IF;
 IF EXISTS(SELECT 1 FROM users) THEN RAISE EXCEPTION 'Benchmark fixture requires empty users table'; END IF;
END $$;
INSERT INTO users(id,full_name,email,role,loyalty_points,loyalty_tier,created_at)
 SELECT md5('customer-'||n)::uuid,'Benchmark customer',n||'@example.test','customer',0,1,now() FROM generate_series(1,20) n;
INSERT INTO users(id,full_name,email,role,loyalty_points,loyalty_tier,created_at)
 VALUES(md5('partner')::uuid,'Benchmark partner','partner@example.test','partner',0,1,now()),
 (md5('admin')::uuid,'Benchmark admin','admin@example.test','admin',0,1,now());
INSERT INTO accommodation_type VALUES(md5('hotel')::uuid,'Hotel');
INSERT INTO room_type VALUES(md5('standard')::uuid,'Standard');
INSERT INTO features VALUES(md5('pool')::uuid,'Pool');
INSERT INTO accommodations(id,partner_id,type_id,name,address,description,base_price,status,created_at)
 SELECT md5('stay-'||n)::uuid,md5('partner')::uuid,md5('hotel')::uuid,'Stay '||n,'Hà Nội',repeat('Accommodation ',20),100000,'active',now()-n*interval '1 second'
 FROM generate_series(1,1000)n;
INSERT INTO images(id,accommodation_id,url)
 SELECT md5('image-'||n)::uuid,md5('stay-'||n)::uuid,'https://example.test/image.jpg' FROM generate_series(1,1000)n;
INSERT INTO accommodation_features SELECT md5('stay-'||n)::uuid,md5('pool')::uuid FROM generate_series(1,1000)n;
INSERT INTO room(id,accommodation_id,room_type_id,name,price,description,status,capacity,created_at)
 SELECT md5('room-'||n)::uuid,md5('stay-'||((n-1)/10+1))::uuid,md5('standard')::uuid,'Room '||n,100000+(n%10)*10000,'Room','available',4,now()
 FROM generate_series(1,10000)n;
INSERT INTO accommodation_snapshot(id,accommodation_id,name,address)
 SELECT md5('stay-snapshot-'||n)::uuid,md5('stay-'||n)::uuid,'Stay '||n,'Hà Nội' FROM generate_series(1,1000)n;
INSERT INTO room_snapshot(id,room_id,name,price,description)
 SELECT md5('room-snapshot-'||n)::uuid,md5('room-'||n)::uuid,'Room '||n,100000+(n%10)*10000,'Room' FROM generate_series(1,10000)n;
INSERT INTO bookings(id,user_id,total_price,subtotal,discount_amount,status,created_at)
 SELECT md5('booking-'||n)::uuid,md5('customer-'||((n-1)%20+1))::uuid,200000+(n%10)*20000,200000+(n%10)*20000,0,'completed',now()-n*interval '1 minute'
 FROM generate_series(1,100000)n;
INSERT INTO booking_details(id,booking_id,accommodation_snapshot_id,room_snapshot_id,check_in_date,check_out_date,quantity,guests,subtotal)
 SELECT md5('detail-'||n)::uuid,md5('booking-'||n)::uuid,md5('stay-snapshot-'||(((n-1)%10000)/10+1))::uuid,
 md5('room-snapshot-'||((n-1)%10000+1))::uuid,date '2025-01-01'+((n-1)/10000)*3,date '2025-01-03'+((n-1)/10000)*3,1,2,200000+(n%10)*20000
 FROM generate_series(1,100000)n;
INSERT INTO payments(id,booking_id,amount,transaction_id,status,created_at)
 SELECT md5('payment-'||n)::uuid,md5('booking-'||n)::uuid,200000+(n%10)*20000,'benchmark-'||n,'success',now()-n*interval '1 minute' FROM generate_series(1,100000)n;
INSERT INTO reviews(id,user_id,booking_id,accommodation_id,rating,comment,created_at)
 SELECT md5('review-'||n)::uuid,md5('customer-'||((n-1)%20+1))::uuid,md5('booking-'||n)::uuid,
 md5('stay-'||(((n-1)%10000)/10+1))::uuid,4+(n%2),'Good stay',now()-n*interval '1 minute' FROM generate_series(1,10000)n;
INSERT INTO reward_ledger(id,user_id,delta,balance_after,source_type,source_id,idempotency_key,created_at)
 SELECT md5('ledger-'||n)::uuid,md5('customer-'||((n-1)%20+1))::uuid,200+(n%10)*20,sum(200+(n%10)*20) over(partition by (n-1)%20 order by n),'COMPLETED',md5('booking-'||n)::uuid,'COMPLETED:'||md5('booking-'||n)::uuid,now()-n*interval '1 minute'
 FROM generate_series(1,100000)n;
UPDATE users u SET loyalty_points=totals.balance FROM (
 SELECT user_id,sum(delta)::integer AS balance FROM reward_ledger GROUP BY user_id
) totals WHERE totals.user_id=u.id;
ANALYZE;
