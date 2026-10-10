import { BookingRules } from '../../config/env';
import { addDays, localNow, minutesToTime, timeToMinutes } from '../../utils/dateTime';

/**
 * Pure scheduling rules — no I/O, so they are trivially unit-testable and are
 * shared by availability lookup and booking creation (single source of truth).
 */

export interface OpeningHours {
  openingTime: string;
  closingTime: string;
}

/**
 * Bookable start times for a service: every `interval` minutes from opening,
 * as long as the service finishes no later than closing time.
 */
export function generateSlotTimes(
  hours: OpeningHours,
  durationMinutes: number,
  intervalMinutes: number,
): string[] {
  const open = timeToMinutes(hours.openingTime);
  const lastStart = timeToMinutes(hours.closingTime) - durationMinutes;
  const slots: string[] = [];
  for (let start = open; start <= lastStart; start += intervalMinutes) {
    slots.push(minutesToTime(start));
  }
  return slots;
}

/** Returns a reason when `date` is outside the bookable window, else null. */
export function validateBookingDate(date: string, now: Date, rules: BookingRules): string | null {
  const today = localNow(now).date;
  if (date < today) {
    return 'The selected date is in the past';
  }
  const lastBookableDate = addDays(today, rules.bookingWindowDays - 1);
  if (date > lastBookableDate) {
    return `Bookings can only be made up to ${rules.bookingWindowDays} days in advance`;
  }
  return null;
}

/** True when the slot on `date` has already started (or passed). */
export function isPastSlot(date: string, time: string, now: Date): boolean {
  const current = localNow(now);
  return date < current.date || (date === current.date && timeToMinutes(time) <= current.minutes);
}

/**
 * Full validation of a requested start time. Returns a human-readable reason
 * when the time cannot be booked, or null when it is valid.
 */
export function validateBookingSlot(
  params: {
    date: string;
    time: string;
    hours: OpeningHours;
    durationMinutes: number;
  },
  now: Date,
  rules: BookingRules,
): string | null {
  const dateProblem = validateBookingDate(params.date, now, rules);
  if (dateProblem) {
    return dateProblem;
  }
  if (isPastSlot(params.date, params.time, now)) {
    return 'The selected time has already passed';
  }
  const slots = generateSlotTimes(params.hours, params.durationMinutes, rules.slotIntervalMinutes);
  if (!slots.includes(params.time)) {
    return (
      `The selected time is not bookable. The salon is open ${params.hours.openingTime}–` +
      `${params.hours.closingTime}, appointments start every ${rules.slotIntervalMinutes} minutes ` +
      'and must finish before closing time'
    );
  }
  return null;
}
