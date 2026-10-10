-- =============================================================================
-- Salon Booking — reference queries
-- These are the queries used by the backend repositories (backend/src/modules),
-- shown here with literal parameters so they can be run directly in psql.
-- =============================================================================

-- 1a. Retrieve all salons.
SELECT s.id, s.name, s.location, s.rating,
       to_char(s.opening_time, 'HH24:MI') AS opening_time,
       to_char(s.closing_time, 'HH24:MI') AS closing_time
FROM salons s
ORDER BY s.rating DESC, s.name ASC;

-- 1b. Search salons by name, location or service name (case-insensitive),
--     as used by GET /salons?search=spa
SELECT s.id, s.name, s.location, s.rating
FROM salons s
WHERE s.name ILIKE '%spa%'
   OR s.location ILIKE '%spa%'
   OR EXISTS (SELECT 1 FROM services sv
              WHERE sv.salon_id = s.id AND sv.name ILIKE '%spa%')
ORDER BY s.rating DESC, s.name ASC;

-- 2. Retrieve services belonging to a salon.
SELECT sv.id, sv.salon_id, sv.name, sv.price, sv.duration_minutes
FROM services sv
WHERE sv.salon_id = 1
ORDER BY sv.price ASC, sv.name ASC;

-- 3. Retrieve bookings belonging to a customer (most recent first).
SELECT b.id, b.customer_id,
       b.salon_id,   sa.name AS salon_name, sa.location AS salon_location,
       b.service_id, sv.name AS service_name, sv.price, sv.duration_minutes,
       to_char(b.booking_date, 'YYYY-MM-DD') AS booking_date,
       to_char(b.booking_time, 'HH24:MI')    AS booking_time,
       b.payment_method, b.status, b.created_at
FROM bookings b
JOIN salons   sa ON sa.id = b.salon_id
JOIN services sv ON sv.id = b.service_id
WHERE b.customer_id = 1
ORDER BY b.booking_date DESC, b.booking_time DESC;

-- 4. Booked (unavailable) times for a service on a given date.
SELECT to_char(b.booking_time, 'HH24:MI') AS booking_time
FROM bookings b
WHERE b.service_id = 1
  AND b.booking_date = CURRENT_DATE + 2
  AND b.status <> 'cancelled';

-- 5. Double-booking-safe booking creation (what POST /bookings executes).
--    Run the same block from two psql sessions simultaneously: the second
--    session blocks on FOR UPDATE until the first commits, then its INSERT
--    fails with unique_violation (23505) on bookings_active_slot_uniq.
BEGIN;
SELECT id FROM services WHERE id = 2 AND salon_id = 1 FOR UPDATE;
INSERT INTO bookings (customer_id, salon_id, service_id, booking_date, booking_time, payment_method)
VALUES (1, 1, 2, CURRENT_DATE + 5, '17:00', 'pay_at_salon')
RETURNING id, status;
COMMIT;
