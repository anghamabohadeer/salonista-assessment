import { Pool } from 'pg';
import request from 'supertest';
import { createTestApp, createTestPool, inDays, resetDatabase, TODAY } from '../helpers/testApp';

const validBooking = () => ({
  customerId: 1,
  salonId: 1,
  serviceId: 2, // Blow Dry, 30 min, salon open 09:00–21:00
  date: inDays(3),
  time: '17:00',
  paymentMethod: 'pay_at_salon',
});

describe('Bookings API', () => {
  let pool: Pool;
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    pool = createTestPool();
    app = createTestApp(pool);
  });

  beforeEach(() => resetDatabase(pool));

  afterAll(() => pool.end());

  describe('POST /bookings', () => {
    it('creates a confirmed booking and returns its full details', async () => {
      const res = await request(app).post('/bookings').send(validBooking()).expect(201);

      expect(res.body.data).toMatchObject({
        customerId: 1,
        date: inDays(3),
        time: '17:00',
        paymentMethod: 'pay_at_salon',
        status: 'confirmed',
        salon: { id: 1, name: 'Glow Beauty Lounge', location: 'Dubai Marina, Dubai' },
        service: { id: 2, name: 'Blow Dry', price: 120, durationMinutes: 30 },
      });
      expect(res.body.data.id).toEqual(expect.any(Number));
      expect(res.headers.location).toBe('/bookings/1');
    });

    it('lists every invalid field in a 400 response', async () => {
      const res = await request(app)
        .post('/bookings')
        .send({ customerId: 'one', salonId: 1, date: '2026-02-30', time: '25:00' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const fields = res.body.error.details.map((d: { field: string }) => d.field).sort();
      expect(fields).toEqual(['customerId', 'date', 'paymentMethod', 'serviceId', 'time']);
    });

    it('rejects unsupported payment methods', async () => {
      const res = await request(app)
        .post('/bookings')
        .send({ ...validBooking(), paymentMethod: 'credit_card' })
        .expect(400);
      expect(res.body.error.details).toEqual([
        { field: 'paymentMethod', message: 'paymentMethod must be one of: pay_at_salon' },
      ]);
    });

    it('rejects unknown fields', async () => {
      const res = await request(app)
        .post('/bookings')
        .send({ ...validBooking(), status: 'completed' })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects malformed JSON', async () => {
      const res = await request(app)
        .post('/bookings')
        .set('Content-Type', 'application/json')
        .send('{"customerId": 1,')
        .expect(400);
      expect(res.body.error.code).toBe('MALFORMED_JSON');
    });

    it('rejects a missing body', async () => {
      const res = await request(app).post('/bookings').expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it.each([
      [{ customerId: 999 }, 'CUSTOMER_NOT_FOUND'],
      [{ salonId: 999 }, 'SALON_NOT_FOUND'],
      [{ serviceId: 999 }, 'SERVICE_NOT_FOUND'],
      // Service 4 exists but belongs to salon 2, not salon 1.
      [{ serviceId: 4 }, 'SERVICE_NOT_FOUND'],
    ])('returns 404 when a referenced entity does not exist (%o)', async (override, code) => {
      const res = await request(app)
        .post('/bookings')
        .send({ ...validBooking(), ...override })
        .expect(404);
      expect(res.body.error.code).toBe(code);
    });

    it.each([
      ['a past date', { date: inDays(-1) }, /past/],
      ['a time earlier today', { date: TODAY, time: '07:30' }, /passed|not bookable/],
      ['a date beyond the booking window', { date: inDays(60) }, /60 days/],
      ['a time before opening', { time: '08:30' }, /not bookable/],
      ['a time that ends after closing', { time: '21:00' }, /not bookable/],
      ['a time off the 30-minute grid', { time: '17:10' }, /not bookable/],
    ])('returns 422 for %s', async (_label, override, message) => {
      const res = await request(app)
        .post('/bookings')
        .send({ ...validBooking(), ...override })
        .expect(422);
      expect(res.body.error.code).toBe('INVALID_BOOKING_TIME');
      expect(res.body.error.message).toMatch(message);
    });

    it('returns 409 when the slot is already booked', async () => {
      await request(app).post('/bookings').send(validBooking()).expect(201);
      const res = await request(app)
        .post('/bookings')
        .send({ ...validBooking(), customerId: 2 })
        .expect(409);
      expect(res.body.error.code).toBe('SLOT_UNAVAILABLE');
    });

    it('allows the same date/time for a different service', async () => {
      await request(app).post('/bookings').send(validBooking()).expect(201);
      await request(app)
        .post('/bookings')
        .send({ ...validBooking(), serviceId: 3 })
        .expect(201);
    });

    it('frees the slot again when the booking is cancelled', async () => {
      const created = await request(app).post('/bookings').send(validBooking()).expect(201);
      await pool.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [
        created.body.data.id,
      ]);
      await request(app).post('/bookings').send(validBooking()).expect(201);
    });

    it('prevents double booking under concurrent requests', async () => {
      const attempts = 10;
      const responses = await Promise.all(
        Array.from({ length: attempts }, (_, i) =>
          request(app)
            .post('/bookings')
            .send({ ...validBooking(), customerId: (i % 2) + 1 }),
        ),
      );

      const statuses = responses.map((res) => res.status).sort();
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(attempts - 1);

      const { rows } = await pool.query(
        `SELECT count(*)::int AS count FROM bookings
         WHERE service_id = 2 AND booking_date = $1 AND booking_time = '17:00'`,
        [inDays(3)],
      );
      expect(rows[0].count).toBe(1);
    });
  });

  describe('database constraints (defence in depth)', () => {
    it('rejects a duplicate active slot even when application checks are bypassed', async () => {
      const insert = `INSERT INTO bookings (customer_id, salon_id, service_id, booking_date, booking_time)
                      VALUES ($1, 1, 2, $2, '17:00')`;
      await pool.query(insert, [1, inDays(3)]);
      await expect(pool.query(insert, [2, inDays(3)])).rejects.toMatchObject({
        code: '23505',
        constraint: 'bookings_active_slot_uniq',
      });
    });

    it('rejects a booking whose service does not belong to the salon', async () => {
      await expect(
        pool.query(
          `INSERT INTO bookings (customer_id, salon_id, service_id, booking_date, booking_time)
           VALUES (1, 1, 4, $1, '17:00')`,
          [inDays(3)],
        ),
      ).rejects.toMatchObject({ code: '23503', constraint: 'bookings_service_salon_fkey' });
    });
  });

  describe('GET /bookings/:customerId', () => {
    it("returns the customer's bookings, most recent first", async () => {
      await request(app).post('/bookings').send(validBooking()).expect(201);

      const res = await request(app).get('/bookings/1').expect(200);
      const dates = res.body.data.map((b: { date: string }) => b.date);
      expect(dates).toEqual([inDays(3), inDays(2), inDays(-7)]);
      expect(res.body.data.every((b: { customerId: number }) => b.customerId === 1)).toBe(true);
    });

    it('returns 404 for an unknown customer', async () => {
      const res = await request(app).get('/bookings/999').expect(404);
      expect(res.body.error.code).toBe('CUSTOMER_NOT_FOUND');
    });

    it('returns 400 for an invalid customer id', async () => {
      await request(app).get('/bookings/abc').expect(400);
    });
  });

  describe('GET /salons/:salonId/services/:serviceId/availability', () => {
    it('marks booked slots as unavailable', async () => {
      // seed.sql books service 1 at 11:00 and 14:00 two days from today.
      const res = await request(app)
        .get('/salons/1/services/1/availability')
        .query({ date: inDays(2) })
        .expect(200);

      const slots: { time: string; available: boolean }[] = res.body.data.slots;
      expect(slots[0]).toEqual({ time: '09:00', available: true });
      // 60-minute service, closes 21:00 → last start 20:00.
      expect(slots[slots.length - 1]?.time).toBe('20:00');
      expect(slots.filter((s) => !s.available).map((s) => s.time)).toEqual(['11:00', '14:00']);
    });

    it('marks slots that already started today as unavailable', async () => {
      const res = await request(app)
        .get('/salons/6/services/15/availability') // Urban Cuts opens 08:00
        .query({ date: TODAY })
        .expect(200);
      expect(res.body.data.slots[0]).toEqual({ time: '08:00', available: false });
      expect(res.body.data.slots[1]).toEqual({ time: '08:30', available: true });
    });

    it('returns 422 for past dates and 400 for invalid dates', async () => {
      await request(app)
        .get('/salons/1/services/1/availability')
        .query({ date: inDays(-1) })
        .expect(422);
      await request(app)
        .get('/salons/1/services/1/availability')
        .query({ date: 'tomorrow' })
        .expect(400);
    });

    it('returns 404 when the service is not offered by the salon', async () => {
      const res = await request(app)
        .get('/salons/2/services/1/availability')
        .query({ date: inDays(1) })
        .expect(404);
      expect(res.body.error.code).toBe('SERVICE_NOT_FOUND');
    });
  });
});
