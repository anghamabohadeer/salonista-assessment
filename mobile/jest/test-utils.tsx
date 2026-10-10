import React, { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { Booking, Salon } from '../src/api/types';

/** Renders `ui` inside a fresh, retry-free React Query client. */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      // gcTime: Infinity avoids lingering 5-minute GC timers that keep Jest alive.
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(ui, { wrapper: Wrapper });
}

/** Minimal navigation double for screens rendered outside a navigator. */
export function createNavigationMock() {
  return {
    navigate: jest.fn(),
    replace: jest.fn(),
    reset: jest.fn(),
    popToTop: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };
}

export const salonFixture: Salon = {
  id: 1,
  name: 'Glow Beauty Lounge',
  location: 'Dubai Marina, Dubai',
  rating: 4.8,
  openingTime: '09:00',
  closingTime: '21:00',
  services: [
    { id: 2, salonId: 1, name: 'Blow Dry', price: 120, durationMinutes: 30 },
    {
      id: 1,
      salonId: 1,
      name: 'Classic Facial',
      price: 250,
      durationMinutes: 60,
    },
  ],
};

export const bookingFixture: Booking = {
  id: 42,
  customerId: 1,
  date: '2026-10-14',
  time: '17:00',
  paymentMethod: 'pay_at_salon',
  status: 'confirmed',
  createdAt: '2026-10-10T08:00:00.000Z',
  salon: { id: 1, name: 'Glow Beauty Lounge', location: 'Dubai Marina, Dubai' },
  service: { id: 2, name: 'Blow Dry', price: 120, durationMinutes: 30 },
};
