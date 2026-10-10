import { RequestHandler } from 'express';
import { logger } from '../utils/logger';

/** Logs one line per request with status code and duration. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms (${req.ip})`,
    );
  });
  next();
};
