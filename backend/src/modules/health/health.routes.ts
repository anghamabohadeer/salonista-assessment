import { Router } from 'express';
import { Pool } from 'pg';

/**
 * GET /health — liveness + database connectivity. Handy when debugging
 * connectivity from a device: open http://<host>:<port>/health in its browser.
 */
export function createHealthRouter(pool: Pool): Router {
  const router = Router();

  router.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  return router;
}
