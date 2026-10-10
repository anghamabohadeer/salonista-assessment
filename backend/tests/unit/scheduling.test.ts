import {
  generateSlotTimes,
  isPastSlot,
  validateBookingDate,
  validateBookingSlot,
} from '../../src/modules/bookings/scheduling';
import { addDays, isValidDate, isValidTime } from '../../src/utils/dateTime';

const rules = { bookingWindowDays: 60, slotIntervalMinutes: 30 };
const hours = { openingTime: '09:00', closingTime: '12:00' };
const now = new Date(2026, 9, 10, 10, 15); // 2026-10-10 10:15 local

describe('dateTime helpers', () => {
  it.each(['2026-10-10', '2028-02-29'])('accepts valid date %s', (date) => {
    expect(isValidDate(date)).toBe(true);
  });

  it.each(['2026-02-30', '2026-13-01', '10-10-2026', '2026-1-1', ''])(
    'rejects invalid date %s',
    (date) => {
      expect(isValidDate(date)).toBe(false);
    },
  );

  it.each(['00:00', '09:30', '23:59'])('accepts valid time %s', (time) => {
    expect(isValidTime(time)).toBe(true);
  });

  it.each(['24:00', '9:30', '12:60', '17:00:00'])('rejects invalid time %s', (time) => {
    expect(isValidTime(time)).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-10', 59)).toBe('2026-12-08');
  });
});

describe('generateSlotTimes', () => {
  it('only offers start times that finish before closing', () => {
    expect(generateSlotTimes(hours, 60, 30)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('returns no slots when the service is longer than opening hours', () => {
    expect(generateSlotTimes(hours, 240, 30)).toEqual([]);
  });
});

describe('validateBookingDate', () => {
  it('rejects past dates', () => {
    expect(validateBookingDate('2026-10-09', now, rules)).toMatch(/past/);
  });

  it('accepts today and the last day of the window', () => {
    expect(validateBookingDate('2026-10-10', now, rules)).toBeNull();
    expect(validateBookingDate('2026-12-08', now, rules)).toBeNull();
  });

  it('rejects dates beyond the booking window', () => {
    expect(validateBookingDate('2026-12-09', now, rules)).toMatch(/60 days/);
  });
});

describe('isPastSlot', () => {
  it('treats a slot that already started today as past', () => {
    expect(isPastSlot('2026-10-10', '10:00', now)).toBe(true);
    expect(isPastSlot('2026-10-10', '10:30', now)).toBe(false);
  });
});

describe('validateBookingSlot', () => {
  const base = { date: '2026-10-11', hours, durationMinutes: 60 };

  it('accepts a valid future slot', () => {
    expect(validateBookingSlot({ ...base, time: '11:00' }, now, rules)).toBeNull();
  });

  it('rejects times outside opening hours', () => {
    expect(validateBookingSlot({ ...base, time: '08:30' }, now, rules)).toMatch(/not bookable/);
  });

  it('rejects slots that would end after closing', () => {
    expect(validateBookingSlot({ ...base, time: '11:30' }, now, rules)).toMatch(/not bookable/);
  });

  it('rejects times not aligned to the slot interval', () => {
    expect(validateBookingSlot({ ...base, time: '09:15' }, now, rules)).toMatch(/not bookable/);
  });

  it('rejects a time earlier today', () => {
    expect(validateBookingSlot({ ...base, date: '2026-10-10', time: '09:00' }, now, rules)).toMatch(
      /already passed/,
    );
  });
});
