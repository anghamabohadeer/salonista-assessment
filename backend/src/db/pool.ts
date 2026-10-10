import { Pool, PoolClient, types } from 'pg';
import { logger } from '../utils/logger';

// Keep DATE columns as plain 'YYYY-MM-DD' strings. The default parser turns
// them into JS Dates at local midnight, which silently shifts days across
// time zones.
types.setTypeParser(types.builtins.DATE, (value) => value);

/** Anything that can run a query: the pool itself or a checked-out client. */
export type Queryable = Pool | PoolClient;

export function createPool(connectionString: string): Pool {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // An idle client erroring (e.g. the DB restarted) must not crash the process.
  pool.on('error', (error) => {
    logger.error('Unexpected PostgreSQL pool error', error);
  });

  return pool;
}
