import { Queryable } from '../../db/pool';
import { Booking, BookingStatus, NewBooking, PaymentMethod } from './booking.types';

/** Name of the partial unique index guarding against double booking. */
export const ACTIVE_SLOT_CONSTRAINT = 'bookings_active_slot_uniq';

interface BookingRow {
  id: number;
  customer_id: number;
  booking_date: string;
  booking_time: string;
  payment_method: PaymentMethod;
  status: BookingStatus;
  created_at: Date;
  salon_id: number;
  salon_name: string;
  salon_location: string;
  service_id: number;
  service_name: string;
  price: number;
  duration_minutes: number;
}

const BOOKING_SELECT = `
  SELECT b.id, b.customer_id,
         to_char(b.booking_date, 'YYYY-MM-DD') AS booking_date,
         to_char(b.booking_time, 'HH24:MI')    AS booking_time,
         b.payment_method, b.status, b.created_at,
         sa.id AS salon_id, sa.name AS salon_name, sa.location AS salon_location,
         sv.id AS service_id, sv.name AS service_name,
         sv.price::float8 AS price, sv.duration_minutes
  FROM bookings b
  JOIN salons   sa ON sa.id = b.salon_id
  JOIN services sv ON sv.id = b.service_id`;

const toBooking = (row: BookingRow): Booking => ({
  id: row.id,
  customerId: row.customer_id,
  date: row.booking_date,
  time: row.booking_time,
  paymentMethod: row.payment_method,
  status: row.status,
  createdAt: row.created_at.toISOString(),
  salon: { id: row.salon_id, name: row.salon_name, location: row.salon_location },
  service: {
    id: row.service_id,
    name: row.service_name,
    price: row.price,
    durationMinutes: row.duration_minutes,
  },
});

export const bookingRepository = {
  async findById(db: Queryable, id: number): Promise<Booking | null> {
    const { rows } = await db.query<BookingRow>(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
    return rows[0] ? toBooking(rows[0]) : null;
  },

  async findByCustomerId(db: Queryable, customerId: number): Promise<Booking[]> {
    const { rows } = await db.query<BookingRow>(
      `${BOOKING_SELECT}
       WHERE b.customer_id = $1
       ORDER BY b.booking_date DESC, b.booking_time DESC`,
      [customerId],
    );
    return rows.map(toBooking);
  },

  /** Start times ('HH:mm') already held by active bookings of a service on a date. */
  async findBookedTimes(db: Queryable, serviceId: number, date: string): Promise<Set<string>> {
    const { rows } = await db.query<{ booking_time: string }>(
      `SELECT to_char(booking_time, 'HH24:MI') AS booking_time
       FROM bookings
       WHERE service_id = $1 AND booking_date = $2 AND status <> 'cancelled'`,
      [serviceId, date],
    );
    return new Set(rows.map((row) => row.booking_time));
  },

  async isSlotTaken(db: Queryable, serviceId: number, date: string, time: string): Promise<boolean> {
    const { rowCount } = await db.query(
      `SELECT 1 FROM bookings
       WHERE service_id = $1 AND booking_date = $2 AND booking_time = $3
         AND status <> 'cancelled'`,
      [serviceId, date, time],
    );
    return (rowCount ?? 0) > 0;
  },

  /** Inserts a confirmed booking and returns its id. */
  async insert(db: Queryable, booking: NewBooking): Promise<number> {
    const { rows } = await db.query<{ id: number }>(
      `INSERT INTO bookings
         (customer_id, salon_id, service_id, booking_date, booking_time, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
       RETURNING id`,
      [
        booking.customerId,
        booking.salonId,
        booking.serviceId,
        booking.date,
        booking.time,
        booking.paymentMethod,
      ],
    );
    return rows[0]!.id;
  },
};
