import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../api/queryClient';
import { salonApi } from '../../../api/salonApi';

/** Time slots for a service on a date. Disabled until a date is chosen. */
export function useAvailability(
  salonId: number,
  serviceId: number,
  date: string | null,
) {
  return useQuery({
    queryKey: queryKeys.availability(salonId, serviceId, date ?? ''),
    queryFn: ({ signal }) =>
      salonApi.getAvailability({ salonId, serviceId, date: date! }, signal),
    enabled: date !== null,
    // Availability changes as others book; always refetch when revisited.
    staleTime: 0,
  });
}
