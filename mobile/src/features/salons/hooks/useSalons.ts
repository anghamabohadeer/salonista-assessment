import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../api/queryClient';
import { salonApi } from '../../../api/salonApi';

/** Salons (with services) filtered server-side by `search`. */
export function useSalons(search: string) {
  return useQuery({
    queryKey: queryKeys.salons(search),
    queryFn: ({ signal }) => salonApi.getSalons(search || undefined, signal),
    // Keep showing the previous results while a new search is in flight.
    placeholderData: keepPreviousData,
  });
}
