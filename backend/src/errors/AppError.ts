export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'MALFORMED_JSON'
  | 'ROUTE_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'SALON_NOT_FOUND'
  | 'SERVICE_NOT_FOUND'
  | 'INVALID_BOOKING_TIME'
  | 'SLOT_UNAVAILABLE'
  | 'DATABASE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * An expected, client-facing error. Anything thrown that is not an AppError
 * is treated as an unexpected failure and reported as a 500.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static notFound(code: ErrorCode, message: string): AppError {
    return new AppError(404, code, message);
  }

  static conflict(code: ErrorCode, message: string): AppError {
    return new AppError(409, code, message);
  }

  static unprocessable(code: ErrorCode, message: string): AppError {
    return new AppError(422, code, message);
  }
}
