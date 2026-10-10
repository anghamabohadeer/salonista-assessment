import { ApiFieldError } from './types';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid_response';

/** Normalised error for every failed API call. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Machine-readable code from the API, e.g. SLOT_UNAVAILABLE. */
  readonly code?: string;
  readonly details?: ApiFieldError[];

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number; code?: string; details?: ApiFieldError[] } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }

  /** Transient failures worth retrying automatically (never 4xx). */
  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      (this.status !== undefined && this.status >= 500)
    );
  }
}

/** A user-presentable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
