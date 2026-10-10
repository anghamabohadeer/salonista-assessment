import { createApp } from './app';
import { loadConfig } from './config/env';
import { createPool } from './db/pool';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = createPool(config.databaseUrl);

  try {
    await pool.query('SELECT 1');
    logger.info('Connected to PostgreSQL');
  } catch (error) {
    // Start anyway: requests will get 503 until the database is reachable.
    logger.warn('PostgreSQL is not reachable yet; API will return 503 until it is', error);
  }

  const app = createApp({ pool, bookingRules: config.bookingRules });
  // Express 5 invokes the listen callback with an error (e.g. EADDRINUSE)
  // instead of emitting it, so both outcomes are handled here.
  const server = app.listen(config.port, config.host, (error?: Error) => {
    if (error) {
      logger.error(`HTTP server failed to start on ${config.host}:${config.port}`, error);
      process.exit(1);
    }
    logger.info(`Salon Booking API listening on http://${config.host}:${config.port}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  logger.error('Fatal startup error', error);
  process.exit(1);
});
