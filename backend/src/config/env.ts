import { existsSync } from 'node:fs';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BOOKING_WINDOW_DAYS: z.coerce.number().int().positive().default(60),
  SLOT_INTERVAL_MINUTES: z.coerce.number().int().positive().max(240).default(30),
});

export interface BookingRules {
  /** How many days ahead (inclusive of today) a booking may be made. */
  bookingWindowDays: number;
  /** Granularity of bookable start times, e.g. 30 → 09:00, 09:30, ... */
  slotIntervalMinutes: number;
}

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  bookingRules: BookingRules;
}

/**
 * Loads `.env` (if present) without overriding variables already set in the
 * process environment, then validates and returns a typed configuration.
 * Fails fast with a readable message when configuration is invalid.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env && existsSync('.env')) {
    process.loadEnvFile('.env');
  }

  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  const values = parsed.data;
  return {
    env: values.NODE_ENV,
    host: values.HOST,
    port: values.PORT,
    databaseUrl: values.DATABASE_URL,
    bookingRules: {
      bookingWindowDays: values.BOOKING_WINDOW_DAYS,
      slotIntervalMinutes: values.SLOT_INTERVAL_MINUTES,
    },
  };
}
