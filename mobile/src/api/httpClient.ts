import { config } from '../config/env';
import { ApiError } from './ApiError';
import { ApiErrorBody } from './types';

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** Cancellation signal (React Query passes one when a query is cancelled). */
  signal?: AbortSignal;
  query?: Record<string, string | undefined>;
}

const FALLBACK_HTTP_MESSAGES: Record<number, string> = {
  400: 'The request was invalid.',
  404: 'The requested item could not be found.',
  409: 'This action conflicts with existing data.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = Object.entries(query ?? {})
    .filter(
      (entry): entry is [string, string] =>
        entry[1] !== undefined && entry[1] !== '',
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');
  return `${config.apiBaseUrl}${path}${params ? `?${params}` : ''}`;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorBody).error?.message === 'string'
  );
}

/**
 * Thin fetch wrapper: JSON in/out, request timeout, caller cancellation, and
 * conversion of every failure mode into an {@link ApiError}. Resolves with the
 * `data` field of the API's `{ data }` envelope.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.requestTimeoutMs);
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError(
        'timeout',
        'The server took too long to respond. Please try again.',
      );
    }
    if (options.signal?.aborted) {
      throw error; // Cancelled by the caller: let React Query handle it silently.
    }
    throw new ApiError(
      'network',
      'Unable to reach the server. Check your internet connection and try again.',
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', forwardAbort);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      'invalid_response',
      'The server returned an unexpected response.',
      {
        status: response.status,
      },
    );
  }

  if (!response.ok) {
    if (isApiErrorBody(payload)) {
      throw new ApiError('http', payload.error.message, {
        status: response.status,
        code: payload.error.code,
        details: payload.error.details,
      });
    }
    throw new ApiError(
      'http',
      FALLBACK_HTTP_MESSAGES[response.status] ??
        'Something went wrong on our side.',
      { status: response.status },
    );
  }

  if (typeof payload !== 'object' || payload === null || !('data' in payload)) {
    throw new ApiError(
      'invalid_response',
      'The server returned an unexpected response.',
      {
        status: response.status,
      },
    );
  }
  return (payload as { data: T }).data;
}
