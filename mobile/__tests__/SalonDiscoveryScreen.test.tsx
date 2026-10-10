import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { ApiError } from '../src/api/ApiError';
import { salonApi } from '../src/api/salonApi';
import { SalonDiscoveryScreen } from '../src/features/salons/screens/SalonDiscoveryScreen';
import {
  createNavigationMock,
  renderWithProviders,
  salonFixture,
} from '../jest/test-utils';

jest.mock('../src/api/salonApi');
const getSalons = jest.mocked(salonApi.getSalons);

async function renderScreen() {
  const navigation = createNavigationMock();
  const props = {
    navigation,
    route: { key: 'SalonDiscovery', name: 'SalonDiscovery' },
  } as unknown as React.ComponentProps<typeof SalonDiscoveryScreen>;
  await renderWithProviders(<SalonDiscoveryScreen {...props} />);
  return { navigation };
}

describe('SalonDiscoveryScreen', () => {
  it('lists salons with location, rating and service prices', async () => {
    getSalons.mockResolvedValue([salonFixture]);
    await renderScreen();

    expect(await screen.findByText('Glow Beauty Lounge')).toBeOnTheScreen();
    expect(screen.getByText('📍 Dubai Marina, Dubai')).toBeOnTheScreen();
    expect(screen.getByText('4.8')).toBeOnTheScreen();
    expect(screen.getByText('Blow Dry')).toBeOnTheScreen();
    expect(screen.getByText('AED 120.00')).toBeOnTheScreen();
  });

  it('requires a service before Book Now and passes it to the booking screen', async () => {
    getSalons.mockResolvedValue([salonFixture]);
    const user = userEvent.setup();
    const { navigation } = await renderScreen();

    const bookNow = await screen.findByRole('button', { name: 'Book Now' });
    expect(bookNow).toBeDisabled();

    await user.press(screen.getByRole('radio', { name: /Classic Facial/ }));
    expect(bookNow).toBeEnabled();
    await user.press(bookNow);

    expect(navigation.navigate).toHaveBeenCalledWith('Booking', {
      salon: {
        id: 1,
        name: 'Glow Beauty Lounge',
        location: 'Dubai Marina, Dubai',
      },
      service: salonFixture.services[1],
    });
  });

  it('searches salons through the API (debounced)', async () => {
    getSalons.mockResolvedValue([salonFixture]);
    const user = userEvent.setup();
    await renderScreen();
    await screen.findByText('Glow Beauty Lounge');

    getSalons.mockResolvedValue([]);
    await user.type(screen.getByLabelText('Search salons'), 'zzz');

    expect(await screen.findByText('No salons found')).toBeOnTheScreen();
    expect(getSalons).toHaveBeenLastCalledWith('zzz', expect.anything());
  });

  it('shows an error with a working retry', async () => {
    getSalons.mockRejectedValueOnce(
      new ApiError('network', 'Unable to reach the server.'),
    );
    const user = userEvent.setup();
    await renderScreen();

    expect(
      await screen.findByText('Unable to reach the server.'),
    ).toBeOnTheScreen();

    getSalons.mockResolvedValue([salonFixture]);
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Glow Beauty Lounge')).toBeOnTheScreen();
  });
});
