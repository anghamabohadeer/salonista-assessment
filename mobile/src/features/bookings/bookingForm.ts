import { PaymentMethod } from '../../api/types';

export interface BookingFormValues {
  date: string | null;
  time: string | null;
  paymentMethod: PaymentMethod | null;
}

export type BookingFormErrors = Partial<
  Record<keyof BookingFormValues, string>
>;

/** Client-side validation; the API re-validates everything authoritatively. */
export function validateBookingForm(
  values: BookingFormValues,
): BookingFormErrors {
  const errors: BookingFormErrors = {};
  if (!values.date) {
    errors.date = 'Please select a date.';
  }
  if (!values.time) {
    errors.time = 'Please select a time slot.';
  }
  if (!values.paymentMethod) {
    errors.paymentMethod = 'Please choose a payment method.';
  }
  return errors;
}

export const hasErrors = (errors: BookingFormErrors): boolean =>
  Object.keys(errors).length > 0;
