-- Review/back up the target first. Additive migration; never run automatically on application startup.
BEGIN;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.users WHERE loyalty_points<0) THEN
  RAISE EXCEPTION 'Reconcile negative legacy reward balances before migrating';
 END IF;
 IF EXISTS (SELECT 1 FROM public.bookings WHERE status='pending' AND created_at IS NULL) THEN
  RAISE EXCEPTION 'Reconcile pending bookings with unknown creation time before migrating';
 END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS auth_version bigint NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE public.accommodations ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.room ADD COLUMN IF NOT EXISTS capacity integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS cancellation_reason varchar(32),
 ADD COLUMN IF NOT EXISTS subtotal numeric(19,0),
 ADD COLUMN IF NOT EXISTS discount_amount numeric(19,0) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS voucher_id uuid,
 ADD COLUMN IF NOT EXISTS voucher_policy varchar(255);
UPDATE public.bookings SET subtotal=total_price WHERE subtotal IS NULL;
UPDATE public.bookings SET expires_at=created_at + interval '15 minutes' WHERE status='pending' AND expires_at IS NULL;
ALTER TABLE public.booking_details ADD COLUMN IF NOT EXISTS guests integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.partner_applications (
 id uuid PRIMARY KEY, user_id uuid NOT NULL UNIQUE REFERENCES public.users(id), business_name varchar(200) NOT NULL,
 description varchar(2000), status varchar(20) NOT NULL, reason varchar(1000), reviewed_by uuid REFERENCES public.users(id),
 created_at timestamptz NOT NULL, reviewed_at timestamptz, version bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES public.users(id), action varchar(80) NOT NULL,
 target_type varchar(80) NOT NULL, target_id uuid, reason varchar(1000), created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reward_catalog (
 id uuid PRIMARY KEY, name varchar(120) NOT NULL, points_cost integer NOT NULL CHECK(points_cost>0),
 discount_amount numeric(19,0) NOT NULL CHECK(discount_amount>0), min_spend numeric(19,0) NOT NULL CHECK(min_spend>discount_amount),
 validity_days integer NOT NULL CHECK(validity_days>0), enabled boolean NOT NULL DEFAULT true,
 version bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reward_vouchers (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.users(id), catalog_id uuid NOT NULL REFERENCES public.reward_catalog(id),
 points_cost integer NOT NULL, discount_amount numeric(19,0) NOT NULL, min_spend numeric(19,0) NOT NULL,
 expires_at timestamptz NOT NULL, status varchar(16) NOT NULL CHECK(status IN ('AVAILABLE','RESERVED','USED')),
 booking_id uuid REFERENCES public.bookings(id), reserved_until timestamptz, version bigint NOT NULL DEFAULT 0, created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reward_ledger (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.users(id), delta bigint NOT NULL,
 balance_after integer NOT NULL CHECK(balance_after>=0), source_type varchar(24) NOT NULL, source_id uuid,
 idempotency_key varchar(128) NOT NULL, created_at timestamptz NOT NULL,
 UNIQUE(user_id,idempotency_key)
);
-- Only accounts without any ledger history are legacy opening balances. A replay
-- must not manufacture OPENING entries for accounts already earning/spending points.
INSERT INTO public.reward_ledger(id,user_id,delta,balance_after,source_type,source_id,idempotency_key,created_at)
 SELECT gen_random_uuid(),u.id,coalesce(u.loyalty_points,0),coalesce(u.loyalty_points,0),'OPENING',u.id,'opening',CURRENT_TIMESTAMP
 FROM public.users u WHERE coalesce(u.loyalty_points,0)<>0
 AND NOT EXISTS (SELECT 1 FROM public.reward_ledger l WHERE l.user_id=u.id)
 ON CONFLICT(user_id,idempotency_key) DO NOTHING;
DO $$ BEGIN
 IF EXISTS (
  SELECT 1 FROM public.users u
  LEFT JOIN (SELECT user_id,sum(delta) AS balance FROM public.reward_ledger GROUP BY user_id) l ON l.user_id=u.id
  WHERE coalesce(u.loyalty_points,0)<>coalesce(l.balance,0)
 ) THEN
  RAISE EXCEPTION 'Reconcile reward ledger and account balances before migrating';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.payment_anomalies (
 id uuid PRIMARY KEY, payment_id uuid, booking_id uuid, transaction_id varchar(100), reason varchar(64) NOT NULL,
 amount numeric(19,0), created_at timestamptz NOT NULL,
 UNIQUE(transaction_id,payment_id,reason)
);
INSERT INTO public.reward_catalog(id,name,points_cost,discount_amount,min_spend,validity_days,enabled,created_at)
 VALUES('00000000-0000-0000-0000-000000000101','Giảm 10.000 VND',1000,10000,100000,30,true,CURRENT_TIMESTAMP)
 ON CONFLICT(id) DO NOTHING;

CREATE INDEX IF NOT EXISTS ix_accommodations_status_created ON public.accommodations(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_accommodations_partner ON public.accommodations(partner_id,status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_room_accommodation_status_capacity ON public.room(accommodation_id,status,capacity,price);
CREATE INDEX IF NOT EXISTS ix_bookings_user_created ON public.bookings(user_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_bookings_status_expiry ON public.bookings(status,expires_at);
CREATE INDEX IF NOT EXISTS ix_booking_details_booking ON public.booking_details(booking_id);
CREATE INDEX IF NOT EXISTS ix_booking_details_room_dates ON public.booking_details(room_snapshot_id,check_in_date,check_out_date,booking_id);
CREATE INDEX IF NOT EXISTS ix_room_snapshot_room ON public.room_snapshot(room_id,id);
CREATE INDEX IF NOT EXISTS ix_accommodation_snapshot_parent ON public.accommodation_snapshot(accommodation_id,id);
CREATE INDEX IF NOT EXISTS ix_images_accommodation ON public.images(accommodation_id);
CREATE INDEX IF NOT EXISTS ix_reviews_public ON public.reviews(accommodation_id,hidden,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS ix_payments_status_created ON public.payments(status,created_at);
CREATE INDEX IF NOT EXISTS ix_reward_ledger_user_created ON public.reward_ledger(user_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_reward_vouchers_user ON public.reward_vouchers(user_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_partner_applications_status ON public.partner_applications(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created ON public.audit_logs(created_at DESC,id DESC);
COMMIT;
