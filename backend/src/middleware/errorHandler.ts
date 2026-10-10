import { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { isDatabaseUnavailable } from '../db/errors';
import { logger } from '../utils/logger';

/** 404 for any route that no router handled. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound('ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} does not exist`));
};

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    (error as SyntaxError & { type?: string }).type === 'entity.parse.failed'
  );
}

/**
 * Single place that turns errors into JSON responses:
 * `{ "error": { "code", "message", "details"? } }`.
 * Unexpected errors are logged and reported without leaking internals.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (isMalformedJson(error)) {
    appError = new AppError(400, 'MALFORMED_JSON', 'Request body is not valid JSON');
  } else if (isDatabaseUnavailable(error)) {
    logger.error(`Database unavailable while handling ${req.method} ${req.originalUrl}`, error);
    appError = new AppError(
      503,
      'DATABASE_UNAVAILABLE',
      'The service is temporarily unavailable. Please try again shortly.',
    );
  } else {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, error);
    appError = new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  }

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
    },
  });
};
