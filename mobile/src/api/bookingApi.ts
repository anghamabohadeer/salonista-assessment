import { request } from './httpClient';
import { Booking, CreateBookingRequest } from './types';

export const bookingApi = {
  createBooking(body: CreateBookingRequest): Promise<Booking> {
    return request<Booking>('/bookings', { method: 'POST', body });
  },

  getCustomerBookings(
    customerId: number,
    signal?: AbortSignal,
  ): Promise<Booking[]> {
    return request<Booking[]>(`/bookings/${customerId}`, { signal });
  },
};
