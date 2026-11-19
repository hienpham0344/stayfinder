-- EXPLAIN on 100k synthetic bookings showed a full sort for partner/admin lists.
-- A global stable-order index lets the semi-join stop after the requested page.
BEGIN;
CREATE INDEX IF NOT EXISTS ix_bookings_created ON public.bookings(created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_payments_created ON public.payments(created_at DESC,id DESC);
COMMIT;
