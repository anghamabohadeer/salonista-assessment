import {
  formatDisplayDate,
  formatTime,
  getUpcomingDays,
  isUpcoming,
  toIsoDate,
} from '../src/utils/date';
import { formatDuration, formatPrice } from '../src/utils/format';
import { validateBookingForm } from '../src/features/bookings/bookingForm';

describe('date utils', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('builds upcoming days starting today, across month boundaries', () => {
    const days = getUpcomingDays(3, new Date(2026, 9, 31, 15, 0));
    expect(days.map(d => d.iso)).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(days[0]).toMatchObject({ weekday: 'Today', isToday: true });
    expect(days[1]).toMatchObject({
      weekday: 'Sun',
      dayOfMonth: '1',
      month: 'Nov',
    });
  });

  it('formats dates and times for display', () => {
    expect(formatDisplayDate('2026-10-14')).toBe('Wed, 14 Oct 2026');
    expect(formatTime('00:30')).toBe('12:30 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('17:05')).toBe('5:05 PM');
  });

  it('detects whether a booking is still upcoming', () => {
    const now = new Date(2026, 9, 14, 16, 59);
    expect(isUpcoming('2026-10-14', '17:00', now)).toBe(true);
    expect(isUpcoming('2026-10-14', '16:30', now)).toBe(false);
  });
});

describe('format utils', () => {
  it('formats prices with the configured currency', () => {
    expect(formatPrice(120)).toBe('AED 120.00');
    expect(formatPrice(99.5)).toBe('AED 99.50');
  });

  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
  });
});

describe('validateBookingForm', () => {
  it('requires date, time and payment method', () => {
    expect(
      validateBookingForm({ date: null, time: null, paymentMethod: null }),
    ).toEqual({
      date: 'Please select a date.',
      time: 'Please select a time slot.',
      paymentMethod: 'Please choose a payment method.',
    });
  });

  it('passes when every field is filled', () => {
    expect(
      validateBookingForm({
        date: '2026-10-14',
        time: '17:00',
        paymentMethod: 'pay_at_salon',
      }),
    ).toEqual({});
  });
});
