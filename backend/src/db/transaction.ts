import { Pool, PoolClient } from 'pg';

/**
 * Runs `work` inside a single database transaction on a dedicated client.
 * Commits when `work` resolves, rolls back when it throws, and always
 * returns the client to the pool.
 */
export async function withTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
