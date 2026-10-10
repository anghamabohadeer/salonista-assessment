import { request } from './httpClient';
import { Availability, Salon } from './types';

export const salonApi = {
  getSalons(
    search: string | undefined,
    signal?: AbortSignal,
  ): Promise<Salon[]> {
    return request<Salon[]>('/salons', { query: { search }, signal });
  },

  getAvailability(
    params: { salonId: number; serviceId: number; date: string },
    signal?: AbortSignal,
  ): Promise<Availability> {
    return request<Availability>(
      `/salons/${params.salonId}/services/${params.serviceId}/availability`,
      { query: { date: params.date }, signal },
    );
  },
};
