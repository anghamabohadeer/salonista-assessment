-- =============================================================================
-- Salon Booking — PostgreSQL schema
--
-- Re-runnable: drops and recreates all objects. Intended for local development
-- and test databases only. Do NOT run against a database holding real data.
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS bookings  CASCADE;
DROP TABLE IF EXISTS services  CASCADE;
DROP TABLE IF EXISTS salons    CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
CREATE TABLE customers (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(30),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- salons
-- -----------------------------------------------------------------------------
CREATE TABLE salons (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    location      VARCHAR(160) NOT NULL,
    rating        NUMERIC(2, 1) NOT NULL DEFAULT 0
                  CHECK (rating BETWEEN 0 AND 5),
    opening_time  TIME NOT NULL,
    closing_time  TIME NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT salons_opening_hours_chk CHECK (opening_time < closing_time)
);

CREATE INDEX salons_name_idx ON salons (lower(name));

-- -----------------------------------------------------------------------------
-- services (each service belongs to exactly one salon)
-- -----------------------------------------------------------------------------
CREATE TABLE services (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    salon_id          INTEGER NOT NULL REFERENCES salons (id) ON DELETE CASCADE,
    name              VARCHAR(120) NOT NULL,
    price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_minutes  INTEGER NOT NULL CHECK (duration_minutes > 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT services_salon_name_key UNIQUE (salon_id, name),
    -- Target for the composite FK on bookings, guaranteeing that a booked
    -- service really belongs to the booked salon.
    CONSTRAINT services_id_salon_key UNIQUE (id, salon_id)
);

CREATE INDEX services_salon_id_idx ON services (salon_id);

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id     INTEGER NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
    salon_id        INTEGER NOT NULL REFERENCES salons (id)    ON DELETE RESTRICT,
    service_id      INTEGER NOT NULL,
    booking_date    DATE NOT NULL,
    booking_time    TIME NOT NULL,
    payment_method  VARCHAR(30) NOT NULL DEFAULT 'pay_at_salon'
                    CHECK (payment_method IN ('pay_at_salon')),
    status          VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT bookings_service_salon_fkey
        FOREIGN KEY (service_id, salon_id)
        REFERENCES services (id, salon_id) ON DELETE RESTRICT
);

-- Double-booking guard (last line of defence, enforced by the database even
-- if application code is bypassed or races): a given service can only hold
-- one active booking per date + time. Cancelled bookings free the slot.
CREATE UNIQUE INDEX bookings_active_slot_uniq
    ON bookings (service_id, booking_date, booking_time)
    WHERE status <> 'cancelled';

CREATE INDEX bookings_customer_id_idx ON bookings (customer_id, booking_date DESC, booking_time DESC);

COMMIT;
