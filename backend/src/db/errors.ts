/** PostgreSQL SQLSTATE codes the application reacts to. */
export const PgErrorCode = {
  UniqueViolation: '23505',
  ForeignKeyViolation: '23503',
} as const;

interface PgError {
  code: string;
  constraint?: string;
}

function isPgError(error: unknown): error is PgError {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  return (
    isPgError(error) &&
    error.code === PgErrorCode.UniqueViolation &&
    (constraint === undefined || error.constraint === constraint)
  );
}

/**
 * True when the database cannot be reached at all (server down, wrong host,
 * refused connection, or PostgreSQL rejecting connections during startup or
 * shutdown — SQLSTATE class 08 / 57P0x).
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (!isPgError(error)) {
    return false;
  }
  const networkCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH'];
  return (
    networkCodes.includes(error.code) ||
    error.code.startsWith('08') ||
    error.code.startsWith('57P0')
  );
}
