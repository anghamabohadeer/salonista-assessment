-- =============================================================================
-- Salon Booking — sample data
-- Run after schema.sql. Booking dates are relative to CURRENT_DATE so the
-- sample data never goes stale.
-- =============================================================================

BEGIN;

INSERT INTO customers (full_name, email, phone) VALUES
    ('Layla Haddad', 'layla.haddad@example.com', '+971500000001'),
    ('Omar Khalil',  'omar.khalil@example.com',  '+971500000002');

INSERT INTO salons (name, location, rating, opening_time, closing_time) VALUES
    ('Glow Beauty Lounge',      'Dubai Marina, Dubai',       4.8, '09:00', '21:00'),
    ('The Gentlemen''s Barber', 'Downtown Dubai, Dubai',     4.6, '10:00', '22:00'),
    ('Serenity Spa & Nails',    'Jumeirah Beach Road, Dubai', 4.9, '09:00', '20:00'),
    ('Velvet Hair Studio',      'Business Bay, Dubai',       4.3, '11:00', '21:00'),
    ('Lush Lashes & Brows',     'Al Barsha, Dubai',          4.5, '10:00', '19:00'),
    ('Urban Cuts',              'JLT, Dubai',                3.9, '08:00', '18:00');

INSERT INTO services (salon_id, name, price, duration_minutes) VALUES
    -- Glow Beauty Lounge
    (1, 'Classic Facial',          250.00, 60),
    (1, 'Blow Dry',                120.00, 30),
    (1, 'Gel Manicure',            150.00, 45),
    -- The Gentlemen's Barber
    (2, 'Haircut',                  90.00, 30),
    (2, 'Beard Trim & Shape',       60.00, 30),
    (2, 'Hot Towel Shave',         110.00, 30),
    -- Serenity Spa & Nails
    (3, 'Swedish Massage (60 min)', 380.00, 60),
    (3, 'Spa Pedicure',            180.00, 60),
    (3, 'Gel Manicure',            140.00, 45),
    -- Velvet Hair Studio
    (4, 'Women''s Haircut',        200.00, 60),
    (4, 'Full Hair Colour',        450.00, 120),
    (4, 'Keratin Treatment',       800.00, 180),
    -- Lush Lashes & Brows
    (5, 'Classic Lash Extensions', 300.00, 90),
    (5, 'Brow Lamination',         180.00, 45),
    -- Urban Cuts
    (6, 'Express Haircut',          50.00, 30),
    (6, 'Kids Haircut',             40.00, 30);

INSERT INTO bookings (customer_id, salon_id, service_id, booking_date, booking_time, payment_method, status) VALUES
    (1, 1, 1, CURRENT_DATE + 2, '11:00', 'pay_at_salon', 'confirmed'),
    (1, 2, 4, CURRENT_DATE - 7, '15:30', 'pay_at_salon', 'completed'),
    (2, 1, 1, CURRENT_DATE + 2, '14:00', 'pay_at_salon', 'confirmed'),
    (2, 3, 7, CURRENT_DATE + 1, '10:00', 'pay_at_salon', 'confirmed');

COMMIT;
