import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';
import { salonApi } from '../src/api/salonApi';
import { salonFixture } from '../jest/test-utils';

jest.mock('../src/api/salonApi');

// The app's real QueryClient schedules cache GC timers; fake timers keep them
// from holding the Jest process open after the test.
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('boots into the salon discovery screen', async () => {
  jest.mocked(salonApi.getSalons).mockResolvedValue([salonFixture]);

  await render(<App />);

  expect(await screen.findByText('Glow Beauty Lounge')).toBeOnTheScreen();
  expect(screen.getByText('My Bookings')).toBeOnTheScreen();
});
