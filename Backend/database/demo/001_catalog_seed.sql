-- REVIEW DRAFT ONLY. Applying this seed requires separate exact-target approval.
-- Fictitious catalog/reward offers; USD integer cents. No historic VND column is reinterpreted.
-- Caller must start a transaction-local session with search_path and both approval settings.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guard$
BEGIN
 IF current_setting('stayfinder.target_schema', true) IS DISTINCT FROM current_schema()
    OR current_schema() NOT IN ('public', 'stayfinder_test_20261013')
    OR current_setting('stayfinder.demo_seed_approved', true) IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'Explicit target and separate demo seed approval required';
 END IF;
 IF to_regclass('locations') IS NULL OR to_regclass('room') IS NULL
    OR to_regclass('demo_price_comparisons') IS NULL OR to_regclass('reward_offers') IS NULL THEN
  RAISE EXCEPTION 'Migrations 001-009 must be present before demo seed';
 END IF;
END
$guard$;

-- Stable demo UUIDs deliberately cannot collide silently; any conflict rolls back the whole batch.
INSERT INTO locations(id,city,country) VALUES
 ('f0000000-0000-4000-8000-000000000101','Đà Lạt','Việt Nam'),
 ('f0000000-0000-4000-8000-000000000102','Phú Quốc','Việt Nam'),
 ('f0000000-0000-4000-8000-000000000103','Đà Nẵng','Việt Nam'),
 ('f0000000-0000-4000-8000-000000000104','Hà Nội','Việt Nam');

INSERT INTO accommodation_type(id,name) VALUES
 ('f0000000-0000-4000-8000-000000000201','Villas'),
 ('f0000000-0000-4000-8000-000000000202','Resort'),
 ('f0000000-0000-4000-8000-000000000203','Homestay'),
 ('f0000000-0000-4000-8000-000000000204','Hotel');

INSERT INTO features(id,name,icon_key) VALUES
 ('f0000000-0000-4000-8000-000000000301','Wi-Fi','Wifi'),
 ('f0000000-0000-4000-8000-000000000302','Parking','Car'),
 ('f0000000-0000-4000-8000-000000000303','Fireplace','Flame'),
 ('f0000000-0000-4000-8000-000000000304','Pool','Waves'),
 ('f0000000-0000-4000-8000-000000000305','Beach access','Umbrella'),
 ('f0000000-0000-4000-8000-000000000306','Breakfast','Coffee'),
 ('f0000000-0000-4000-8000-000000000307','Air conditioning','Wind'),
 ('f0000000-0000-4000-8000-000000000308','Elevator','Building');

-- All names, addresses, prices and amenities below are illustrative demo data.
-- partner_id and historical base_price remain NULL; no fictitious host/rating is created.
INSERT INTO accommodations
 (id,type_id,name,address,description,status,location_id,timezone,cleaning_fee_cents,service_fee_cents,bedrooms,beds,baths,curated_popular_rank,curated_recommended_rank)
VALUES
 ('f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000201','Demo Alpine Lodge','Đường Hùng Vương, Đà Lạt','Fictitious hillside lodge for StayFinder demo.','active','f0000000-0000-4000-8000-000000000101','Asia/Ho_Chi_Minh',1200,500,2,3,2,1,1),
 ('f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000202','Demo Coastal Resort','Bãi Trường, Phú Quốc','Fictitious coastal resort for StayFinder demo.','active','f0000000-0000-4000-8000-000000000102','Asia/Ho_Chi_Minh',1800,700,2,2,2,2,2),
 ('f0000000-0000-4000-8000-000000000403','f0000000-0000-4000-8000-000000000203','Demo Urban Loft','Đường Nguyễn Văn Linh, Đà Nẵng','Fictitious city loft for StayFinder demo.','active','f0000000-0000-4000-8000-000000000103','Asia/Ho_Chi_Minh',900,300,1,1,1,3,3),
 ('f0000000-0000-4000-8000-000000000404','f0000000-0000-4000-8000-000000000204','Demo Ivy Boutique','Phố Hàng Bè, Hà Nội','Fictitious boutique hotel for StayFinder demo.','active','f0000000-0000-4000-8000-000000000104','Asia/Ho_Chi_Minh',1000,400,1,1,1,4,4);

INSERT INTO accommodation_features(accommodation_id,features_id) VALUES
 ('f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000301'),
 ('f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000302'),
 ('f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000303'),
 ('f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000304'),
 ('f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000305'),
 ('f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000306'),
 ('f0000000-0000-4000-8000-000000000403','f0000000-0000-4000-8000-000000000301'),
 ('f0000000-0000-4000-8000-000000000403','f0000000-0000-4000-8000-000000000307'),
 ('f0000000-0000-4000-8000-000000000404','f0000000-0000-4000-8000-000000000301'),
 ('f0000000-0000-4000-8000-000000000404','f0000000-0000-4000-8000-000000000308');

INSERT INTO room
 (id,accommodation_id,name,description,status,nightly_price_cents,max_guests_per_room,stock_total,size_sqm,bed_type,includes_breakfast)
VALUES
 ('f0000000-0000-4000-8000-000000000501','f0000000-0000-4000-8000-000000000401','Alpine Deluxe','Fictitious mountain-view room.','available',29900,2,3,42,'King',true),
 ('f0000000-0000-4000-8000-000000000502','f0000000-0000-4000-8000-000000000401','Alpine Family Suite','Fictitious two-bedroom suite.','available',51900,4,2,75,'Two king beds',true),
 ('f0000000-0000-4000-8000-000000000503','f0000000-0000-4000-8000-000000000402','Coastal Villa','Fictitious poolside villa.','available',42000,2,4,90,'Super king',true),
 ('f0000000-0000-4000-8000-000000000504','f0000000-0000-4000-8000-000000000403','Urban Loft','Fictitious city loft room.','available',18500,2,3,38,'Queen',false),
 ('f0000000-0000-4000-8000-000000000505','f0000000-0000-4000-8000-000000000404','Ivy Double','Fictitious boutique double room.','available',28000,2,3,32,'Queen',false);

-- External demo images reuse existing prototype URLs; availability is not guaranteed.
INSERT INTO images(id,accommodation_id,url) VALUES
 ('f0000000-0000-4000-8000-000000000601','f0000000-0000-4000-8000-000000000401','https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'),
 ('f0000000-0000-4000-8000-000000000602','f0000000-0000-4000-8000-000000000402','https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80'),
 ('f0000000-0000-4000-8000-000000000603','f0000000-0000-4000-8000-000000000403','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'),
 ('f0000000-0000-4000-8000-000000000604','f0000000-0000-4000-8000-000000000404','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80');

-- Synthetic offers are comparable: USD, same selected tier/dates/quantity,
-- full flat fees included, same free-before-check-in cancellation as direct.
-- observed_at is the seed execution time and never refreshed automatically.
INSERT INTO demo_price_comparisons
 (id,accommodation_id,room_id,provider_name,nightly_price_cents,currency,includes_fees,cleaning_fee_cents,service_fee_cents,cancellation_code,observed_at)
VALUES
 ('f0000000-0000-4000-8000-000000000701','f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000501','Demo Travel A',31900,'USD',true,1200,500,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000702','f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000501','Demo Travel B',32900,'USD',true,1200,500,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000703','f0000000-0000-4000-8000-000000000401','f0000000-0000-4000-8000-000000000502','Demo Travel A',53900,'USD',true,1200,500,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000704','f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000503','Demo Travel A',44900,'USD',true,1800,700,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000705','f0000000-0000-4000-8000-000000000402','f0000000-0000-4000-8000-000000000503','Demo Travel B',45900,'USD',true,1800,700,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000706','f0000000-0000-4000-8000-000000000403','f0000000-0000-4000-8000-000000000504','Demo Travel A',19900,'USD',true,900,300,'free_before_checkin',CURRENT_TIMESTAMP),
 ('f0000000-0000-4000-8000-000000000707','f0000000-0000-4000-8000-000000000404','f0000000-0000-4000-8000-000000000505','Demo Travel A',29900,'USD',true,1000,400,'free_before_checkin',CURRENT_TIMESTAMP);

-- Catalog only: no starting USER wallet balance or fictitious earned history.
INSERT INTO reward_offers
 (id,code,title,kind,points_cost,active,validity_days,discount_percent,discount_cap_cents,minimum_room_subtotal_cents,benefit_value_cents,fulfilment_description)
VALUES
 ('f0000000-0000-4000-8000-000000000801','DEMO_BREAKFAST','Demo breakfast','breakfast',5000,true,30,NULL,NULL,NULL,NULL,'Demo entitlement only; service fulfilment is not guaranteed.'),
 ('f0000000-0000-4000-8000-000000000802','DEMO_UPGRADE','Demo room upgrade','room_upgrade',12000,true,30,NULL,NULL,NULL,NULL,'Demo entitlement only; service fulfilment is not guaranteed.'),
 ('f0000000-0000-4000-8000-000000000803','DEMO_SPA50','Demo $50 spa credit','spa_credit',8500,true,30,NULL,NULL,NULL,5000,'Demo entitlement only; service fulfilment is not guaranteed.'),
 ('f0000000-0000-4000-8000-000000000804','DEMO_VOUCHER5','Demo 5% room discount','discount_voucher',1000,true,30,5,2500,10000,NULL,'Demo discount on room subtotal only; maximum $25 and no stacking.');

COMMIT;
