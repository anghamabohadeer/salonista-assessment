import { BookingStatus, PaymentMethod } from '../api/types';
import { config } from '../config/env';

/** 120 → 'AED 120.00' */
export function formatPrice(amount: number): string {
  return `${config.currency} ${amount.toFixed(2)}`;
}

/** 90 → '1h 30m', 45 → '45 min' */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pay_at_salon: 'Pay at Salon',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
