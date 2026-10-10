import React from 'react';
import { screen, userEvent } from '@testing-library/react-native';
import { ApiError } from '../src/api/ApiError';
import { bookingApi } from '../src/api/bookingApi';
import { salonApi } from '../src/api/salonApi';
import { BookingScreen } from '../src/features/bookings/screens/BookingScreen';
import { toIsoDate } from '../src/utils/date';
import {
  bookingFixture,
  createNavigationMock,
  renderWithProviders,
  salonFixture,
} from '../jest/test-utils';

jest.mock('../src/api/salonApi');
jest.mock('../src/api/bookingApi');
const getAvailability = jest.mocked(salonApi.getAvailability);
const createBooking = jest.mocked(bookingApi.createBooking);

const service = salonFixture.services[0]; // Blow Dry, AED 120
const today = toIsoDate(new Date());

async function renderScreen() {
  const navigation = createNavigationMock();
  const props = {
    navigation,
    route: {
      key: 'Booking',
      name: 'Booking',
      params: {
        salon: {
          id: 1,
          name: salonFixture.name,
          location: salonFixture.location,
        },
        service,
      },
    },
  } as unknown as React.ComponentProps<typeof BookingScreen>;
  await renderWithProviders(<BookingScreen {...props} />);
  return { navigation };
}

beforeEach(() => {
  getAvailability.mockResolvedValue({
    salonId: 1,
    serviceId: service.id,
    date: today,
    slots: [
      { time: '16:30', available: false },
      { time: '17:00', available: true },
    ],
  });
});

describe('BookingScreen', () => {
  it('shows the booking summary and live availability', async () => {
    await renderScreen();

    expect(screen.getByText('Glow Beauty Lounge')).toBeOnTheScreen();
    expect(screen.getByText('Blow Dry')).toBeOnTheScreen();
    expect(screen.getAllByText('AED 120.00').length).toBeGreaterThan(0);
    expect(
      await screen.findByRole('button', { name: '5:00 PM' }),
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: '4:30 PM, unavailable' }),
    ).toBeDisabled();
    expect(getAvailability).toHaveBeenCalledWith(
      { salonId: 1, serviceId: service.id, date: today },
      expect.anything(),
    );
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    await renderScreen();
    await screen.findByRole('button', { name: '5:00 PM' });

    await user.press(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(screen.getByText('Please select a time slot.')).toBeOnTheScreen();
    expect(
      screen.getByText('Please choose a payment method.'),
    ).toBeOnTheScreen();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('creates the booking and opens the confirmation screen', async () => {
    createBooking.mockResolvedValue(bookingFixture);
    const user = userEvent.setup();
    const { navigation } = await renderScreen();

    await user.press(await screen.findByRole('button', { name: '5:00 PM' }));
    await user.press(screen.getByRole('radio', { name: /Pay at Salon/ }));
    await user.press(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(createBooking).toHaveBeenCalledWith({
      customerId: 1,
      salonId: 1,
      serviceId: service.id,
      date: today,
      time: '17:00',
      paymentMethod: 'pay_at_salon',
    });
    expect(navigation.replace).toHaveBeenCalledWith('BookingConfirmation', {
      booking: bookingFixture,
    });
  });

  it('explains a double-booking conflict returned by the API', async () => {
    createBooking.mockRejectedValue(
      new ApiError(
        'http',
        'This time slot has just been booked. Please choose another time.',
        {
          status: 409,
          code: 'SLOT_UNAVAILABLE',
        },
      ),
    );
    const user = userEvent.setup();
    const { navigation } = await renderScreen();

    await user.press(await screen.findByRole('button', { name: '5:00 PM' }));
    await user.press(screen.getByRole('radio', { name: /Pay at Salon/ }));
    await user.press(screen.getByRole('button', { name: 'Confirm Booking' }));

    expect(
      await screen.findByText(
        'This time slot has just been booked. Please choose another time.',
      ),
    ).toBeOnTheScreen();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
