import express, { Express } from 'express';
import { Pool } from 'pg';
import { BookingRules } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createBookingRouter } from './modules/bookings/booking.routes';
import { createBookingService } from './modules/bookings/booking.service';
import { createHealthRouter } from './modules/health/health.routes';
import { createSalonRouter } from './modules/salons/salon.routes';
import { createSalonService } from './modules/salons/salon.service';

export interface AppDependencies {
  pool: Pool;
  bookingRules: BookingRules;
  now?: () => Date;
}

/** Builds the Express app. Kept free of `listen()` so tests can mount it directly. */
export function createApp({ pool, bookingRules, now }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestLogger);
  app.use(express.json({ limit: '10kb' }));

  app.use(createHealthRouter(pool));
  app.use(createSalonRouter(createSalonService(pool)));
  app.use(createBookingRouter(createBookingService({ pool, rules: bookingRules, now })));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
