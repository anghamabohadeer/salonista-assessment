import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../../api/bookingApi';
import { queryKeys } from '../../../api/queryClient';
import { CreateBookingRequest } from '../../../api/types';
import { config } from '../../../config/env';

/** Bookings of the current customer. */
export function useCustomerBookings(customerId: number = config.customerId) {
  return useQuery({
    queryKey: queryKeys.customerBookings(customerId),
    queryFn: ({ signal }) => bookingApi.getCustomerBookings(customerId, signal),
  });
}

/** Creates a booking and refreshes the data it affects. */
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateBookingRequest) =>
      bookingApi.createBooking(request),
    onSettled: (_booking, _error, request) => {
      // Success or conflict: either way, availability may have changed.
      queryClient.invalidateQueries({ queryKey: queryKeys.availabilityRoot });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customerBookings(request.customerId),
      });
    },
  });
}
