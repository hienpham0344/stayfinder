-- Fresh, isolated databases ONLY. Existing deployments start with 001 after schema review.
BEGIN;
CREATE TABLE public.users (
 id uuid PRIMARY KEY, full_name varchar(100), email varchar(255), phone varchar(30), role varchar(20),
 avatar_url varchar(2048), loyalty_points integer DEFAULT 0, loyalty_tier integer DEFAULT 1, created_at timestamptz
);
CREATE TABLE public.accommodation_type (id uuid PRIMARY KEY, name varchar(255));
CREATE TABLE public.features (id uuid PRIMARY KEY, name varchar(255));
CREATE TABLE public.room_type (id uuid PRIMARY KEY, name varchar(255));
CREATE TABLE public.payments_method (id uuid PRIMARY KEY, name varchar(255));
CREATE TABLE public.accommodations (
 id uuid PRIMARY KEY, partner_id uuid REFERENCES public.users(id), type_id uuid REFERENCES public.accommodation_type(id),
 name varchar(255), address varchar(255), latitude numeric(38,8), longitude numeric(38,8),
 description text, base_price numeric(19,0), status varchar(20), created_at timestamptz
);
CREATE TABLE public.images (id uuid PRIMARY KEY, accommodation_id uuid REFERENCES public.accommodations(id), url varchar(2048));
CREATE TABLE public.accommodation_features (
 accommodation_id uuid REFERENCES public.accommodations(id), features_id uuid REFERENCES public.features(id),
 PRIMARY KEY(accommodation_id,features_id)
);
CREATE TABLE public.room (
 id uuid PRIMARY KEY, accommodation_id uuid REFERENCES public.accommodations(id), room_type_id uuid REFERENCES public.room_type(id),
 name varchar(255), price numeric(19,0), description text, status varchar(20), created_at timestamptz
);
CREATE TABLE public.accommodation_snapshot (
 id uuid PRIMARY KEY, accommodation_id uuid REFERENCES public.accommodations(id), name varchar(255), address varchar(255)
);
CREATE TABLE public.room_snapshot (
 id uuid PRIMARY KEY, room_id uuid REFERENCES public.room(id), name varchar(255), price numeric(19,0), description text
);
CREATE TABLE public.bookings (
 id uuid PRIMARY KEY, user_id uuid REFERENCES public.users(id), promotion_id uuid,
 total_price numeric(19,0), status varchar(20), created_at timestamptz
);
CREATE TABLE public.booking_details (
 id uuid PRIMARY KEY, booking_id uuid REFERENCES public.bookings(id),
 accommodation_snapshot_id uuid REFERENCES public.accommodation_snapshot(id), room_snapshot_id uuid REFERENCES public.room_snapshot(id),
 check_in_date date, check_out_date date, quantity integer, subtotal numeric(19,0)
);
CREATE TABLE public.payments (
 id uuid PRIMARY KEY, booking_id uuid REFERENCES public.bookings(id), payment_method_id uuid REFERENCES public.payments_method(id),
 amount numeric(19,0), transaction_id varchar(255), status varchar(20), created_at timestamptz
);
CREATE TABLE public.favorites (
 id uuid PRIMARY KEY, user_id uuid REFERENCES public.users(id), accommodation_id uuid REFERENCES public.accommodations(id)
);
CREATE TABLE public.reviews (
 id uuid PRIMARY KEY, user_id uuid REFERENCES public.users(id), booking_id uuid REFERENCES public.bookings(id),
 accommodation_id uuid REFERENCES public.accommodations(id), rating integer CHECK(rating BETWEEN 1 AND 5), comment text, created_at timestamptz
);
COMMIT;
