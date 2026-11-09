-- Review duplicate rows before running: each unique index will stop the transaction if conflicts exist.
-- This migration is intentionally manual while the database is unavailable.
BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash varchar(255);
-- Registration now creates public.users rows directly, without Supabase Auth identities.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_normalized
    ON public.users (lower(btrim(email))) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_id
    ON public.payments (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_favorites_user_accommodation
    ON public.favorites (user_id, accommodation_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_booking_user
    ON public.reviews (booking_id, user_id);

COMMIT;
