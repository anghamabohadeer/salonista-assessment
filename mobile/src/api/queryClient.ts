import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './ApiError';

/** Centralised cache keys so invalidation stays consistent. */
export const queryKeys = {
  salons: (search: string) => ['salons', { search }] as const,
  availabilityRoot: ['availability'] as const,
  availability: (salonId: number, serviceId: number, date: string) =>
    ['availability', { salonId, serviceId, date }] as const,
  customerBookings: (customerId: number) => ['bookings', customerId] as const,
};

const MAX_RETRIES = 2;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry only transient failures; a 404/400 will not fix itself.
        retry: (failureCount, error) =>
          error instanceof ApiError &&
          error.isRetryable &&
          failureCount < MAX_RETRIES,
      },
      mutations: { retry: false },
    },
  });
}
