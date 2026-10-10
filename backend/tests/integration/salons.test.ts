import { Pool } from 'pg';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createPool } from '../../src/db/pool';
import { createTestApp, createTestPool, resetDatabase, testRules } from '../helpers/testApp';

describe('Salons API', () => {
  let pool: Pool;
  let app: ReturnType<typeof createTestApp>;

  beforeAll(async () => {
    pool = createTestPool();
    await resetDatabase(pool);
    app = createTestApp(pool);
  });

  afterAll(() => pool.end());

  describe('GET /salons', () => {
    it('returns all salons with their services, highest rated first', async () => {
      const res = await request(app).get('/salons').expect(200);

      expect(res.body.data).toHaveLength(6);
      const ratings = res.body.data.map((salon: { rating: number }) => salon.rating);
      expect(ratings).toEqual([...ratings].sort((a, b) => b - a));

      const glow = res.body.data.find((salon: { id: number }) => salon.id === 1);
      expect(glow).toMatchObject({
        name: 'Glow Beauty Lounge',
        location: 'Dubai Marina, Dubai',
        rating: 4.8,
        openingTime: '09:00',
        closingTime: '21:00',
      });
      expect(glow.services).toHaveLength(3);
      expect(glow.services[0]).toEqual({
        id: 2,
        salonId: 1,
        name: 'Blow Dry',
        price: 120,
        durationMinutes: 30,
      });
    });

    it('filters by salon name, location or service name (case-insensitive)', async () => {
      const byName = await request(app).get('/salons').query({ search: 'barber' }).expect(200);
      expect(byName.body.data.map((s: { name: string }) => s.name)).toEqual([
        "The Gentlemen's Barber",
      ]);

      const byLocation = await request(app).get('/salons').query({ search: 'marina' }).expect(200);
      expect(byLocation.body.data).toHaveLength(1);

      const byService = await request(app).get('/salons').query({ search: 'GEL MANI' }).expect(200);
      expect(byService.body.data).toHaveLength(2);
    });

    it('treats LIKE wildcards in the search term literally', async () => {
      const res = await request(app).get('/salons').query({ search: '%' }).expect(200);
      expect(res.body.data).toEqual([]);
    });

    it('ignores a blank search term', async () => {
      const res = await request(app).get('/salons').query({ search: '   ' }).expect(200);
      expect(res.body.data).toHaveLength(6);
    });

    it('rejects an overly long search term', async () => {
      const res = await request(app)
        .get('/salons')
        .query({ search: 'x'.repeat(101) })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('search');
    });
  });

  describe('GET /salons/:id', () => {
    it('returns a single salon', async () => {
      const res = await request(app).get('/salons/3').expect(200);
      expect(res.body.data.name).toBe('Serenity Spa & Nails');
      expect(res.body.data.services).toHaveLength(3);
    });

    it('returns 404 for an unknown salon', async () => {
      const res = await request(app).get('/salons/999').expect(404);
      expect(res.body.error).toEqual({
        code: 'SALON_NOT_FOUND',
        message: 'Salon with id 999 was not found',
      });
    });

    it.each(['abc', '0', '-1', '1.5'])('returns 400 for invalid id %s', async (id) => {
      const res = await request(app).get(`/salons/${id}`).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /salons/:id/services', () => {
    it('returns the services of a salon ordered by price', async () => {
      const res = await request(app).get('/salons/4/services').expect(200);
      expect(res.body.data.map((s: { price: number }) => s.price)).toEqual([200, 450, 800]);
    });

    it('returns 404 for an unknown salon', async () => {
      const res = await request(app).get('/salons/999/services').expect(404);
      expect(res.body.error.code).toBe('SALON_NOT_FOUND');
    });
  });

  describe('infrastructure', () => {
    it('reports health with database status', async () => {
      await request(app).get('/health').expect(200, { status: 'ok', database: 'up' });
    });

    it('returns a JSON 404 for unknown routes', async () => {
      const res = await request(app).get('/nope').expect(404);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('returns 503 with a clear error when the database is unreachable', async () => {
      const deadPool = createPool('postgres://localhost:1/unreachable');
      const deadApp = createApp({ pool: deadPool, bookingRules: testRules });
      try {
        const res = await request(deadApp).get('/salons').expect(503);
        expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
        await request(deadApp).get('/health').expect(503);
      } finally {
        await deadPool.end();
      }
    });
  });
});
