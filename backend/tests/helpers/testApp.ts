import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { createApp } from '../../src/app';
import { BookingRules } from '../../src/config/env';
import { createPool } from '../../src/db/pool';
import { addDays, localNow } from '../../src/utils/dateTime';

const SQL_DIR = path.resolve(__dirname, '..', '..', '..', 'database');

export const testRules: BookingRules = { bookingWindowDays: 60, slotIntervalMinutes: 30 };

/**
 * Fixed clock for deterministic tests: today at 08:00 local time. Anchored to
 * the real date because seed.sql creates bookings relative to CURRENT_DATE.
 */
export const FIXED_NOW = (() => {
  const date = new Date();
  date.setHours(8, 0, 0, 0);
  return date;
})();
export const TODAY = localNow(FIXED_NOW).date;
export const inDays = (days: number): string => addDays(TODAY, days);

export function requireTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL must be set to run integration tests (see .env.example)');
  }
  return url;
}

export function createTestPool(): Pool {
  return createPool(requireTestDatabaseUrl());
}

/** Drops and recreates the schema, then loads sample data. */
export async function resetDatabase(pool: Pool): Promise<void> {
  for (const file of ['schema.sql', 'seed.sql']) {
    await pool.query(readFileSync(path.join(SQL_DIR, file), 'utf8'));
  }
}

export function createTestApp(pool: Pool) {
  return createApp({ pool, bookingRules: testRules, now: () => FIXED_NOW });
}
